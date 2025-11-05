import { GameState } from '../hooks/useGameLogic';

type ReferralSummary = {
  telegramId: number;
  username?: string;
  playerId?: string;
  title?: string;
  level?: number;
  balance?: number;
  totalEarned?: number;
  seedsPlanted?: number;
  fruitsHarvested?: number;
  hybridsCreated?: number;
  dailyStreak?: number;
  dailyCycleDay?: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

class GameAPI {
  private tgId: number | null = null;
  private initData: string | null = null;
  private saving = false;
  private lastServerUpdatedAt: number | null = null;
  private customStats: Record<string, unknown> = {};

  init(tgId: number, initData?: string | null) {
    this.tgId = tgId;
    if (typeof initData === 'string') {
      this.initData = initData;
    }
    this.customStats = {};
  }

  setTelegramInitData(initData: string | null) {
    this.initData = initData;
  }

  isSaving() {
    return this.saving;
  }

  private storageKey() {
    return this.tgId ? `eco_empire_save_${this.tgId}` : 'eco_empire_save';
  }

  private buildHeaders(base: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...base };
    if (this.initData) {
      headers['x-telegram-init-data'] = this.initData;
    } else if (import.meta.env.DEV && this.tgId) {
      headers['x-dev-user-id'] = String(this.tgId);
    }
    return headers;
  }

  private getSaveUrl() {
    if (!this.tgId) throw new Error('Telegram ID not initialised');
    const base = API_BASE_URL || '';
    return `${base}/api/save/${this.tgId}`;
  }

  private persistLocal(gameState: GameState, updatedAt: number) {
    try {
      const payload = { __updatedAt: updatedAt, state: gameState };
      localStorage.setItem(this.storageKey(), JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist local state', error);
    }
  }

  private async loadLocal(): Promise<GameState | null> {
    if (!this.tgId) return null;
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      this.lastServerUpdatedAt = parsed.__updatedAt ?? null;
      return parsed.state as GameState;
    } catch (error) {
      console.error('Failed to load local state', error);
      return null;
    }
  }

  async updateCustomStats(partial: Record<string, unknown>) {
    if (!this.tgId) return;
    this.customStats = { ...this.customStats, ...partial };

    try {
      await fetch(`${API_BASE_URL}/api/stats/update`, {
        method: 'POST',
        headers: this.buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          user_id: this.tgId,
          inc_session: false,
          time_spent: 0,
          achievements: [],
          custom_stats: this.customStats,
        }),
      });
    } catch (error) {
      console.error('Failed to update custom stats', error);
    }
  }

  async grantReferralReward(type: 'sale' | 'ton', amount: number) {
    if (!this.tgId || amount <= 0) return;
    try {
      await fetch(`${API_BASE_URL}/api/referrals/reward`, {
        method: 'POST',
        headers: this.buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason: type, amount }),
      });
    } catch (error) {
      console.error('Failed to grant referral reward', error);
    }
  }

  async getReferrals(): Promise<ReferralSummary[]> {
    if (!this.tgId) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/referrals/${this.tgId}`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to load referrals: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data?.referrals) ? data.referrals : [];
    } catch (error) {
      console.error('Failed to fetch referrals', error);
      return [];
    }
  }

  async getTopPlayers(type: 'eco' | 'other', limit: number = 100): Promise<ReferralSummary[]> {
    try {
      const url = `${API_BASE_URL}/api/top?type=${type}&limit=${limit}`;
      console.log('[gameAPI] getTopPlayers: fetching from', url);
      const headers = this.buildHeaders();
      console.log('[gameAPI] getTopPlayers: headers', Object.keys(headers));
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      console.log('[gameAPI] getTopPlayers: response status', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        console.error('[gameAPI] Top players API error:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || `Failed to load top players: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[gameAPI] getTopPlayers: response data', data);
      
      if (!data || !Array.isArray(data.players)) {
        console.error('[gameAPI] Invalid top players response:', data);
        return [];
      }
      
      return data.players;
    } catch (error: any) {
      console.error('[gameAPI] Failed to fetch top players', error);
      throw error;
    }
  }

  async getDailyWeeklyQuest(type: 'daily' | 'weekly'): Promise<{ questId: string; updatedAt: number; expiresAt: number } | null> {
    try {
      const url = `${API_BASE_URL}/api/quests/${type}`;
      const headers = this.buildHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Квест еще не назначен - это нормально
          return null;
        }
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        console.error(`[gameAPI] Quest ${type} API error:`, response.status, errorData);
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`[gameAPI] Failed to fetch ${type} quest`, error);
      return null;
    }
  }


  async getUserData(): Promise<GameState | null> {
    if (!this.tgId) return null;

    // Пробуем локальное сохранение сначала (быстрый старт)
    const cached = await this.loadLocal();

    try {
      const response = await fetch(this.getSaveUrl(), {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (response.status === 404) {
        return cached;
      }

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }

      const data = await response.json();
      if (data?.save_data) {
        this.lastServerUpdatedAt = data.updated_at ?? null;
        this.persistLocal(data.save_data, data.updated_at ?? Date.now());
        return data.save_data as GameState;
      }
    } catch (error) {
      console.error('Failed to fetch user data from API', error);
    }

    return cached;
  }

  async saveUserData(gameState: GameState): Promise<GameState | null> {
    if (!this.tgId) return null;

    this.saving = true;
    const updatedAt = Date.now();
    this.persistLocal(gameState, updatedAt);

    const startPayload = {
      tgId: this.tgId,
      hasInitData: !!this.initData,
      updatedAt,
    };
    console.log('[gameAPI] saveUserData start', startPayload);

    try {
      const payload: any = {
        save_data: gameState,
        updated_at: updatedAt,
      };

      if (this.lastServerUpdatedAt != null) {
        payload.last_client_known = this.lastServerUpdatedAt;
      }

      const url = this.getSaveUrl();
      const headers = this.buildHeaders({ 'Content-Type': 'application/json' });
      const body = JSON.stringify(payload);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body,
      });

      let errorText: string | undefined;
      if (!response.ok) {
        try {
          errorText = await response.text();
        } catch (error) {
          errorText = String(error);
        }
      }

      console.log('[gameAPI] saveUserData response', response.status, errorText);

      if (response.status === 409) {
        let conflict: any = {};
        try {
          conflict = await response.json();
        } catch (e) {
          conflict = {};
        }
        this.lastServerUpdatedAt = conflict.updated_at ?? this.lastServerUpdatedAt;
        console.warn('Server state is newer, reloading latest save');
        const latest = await this.getUserData();
        return latest;
      }

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const result = await response.json();
      this.lastServerUpdatedAt = result?.updated_at ?? updatedAt;
      return null;
    } catch (error) {
      console.error('Failed to save user data to API', error);
      return null;
    } finally {
      this.saving = false;
    }
  }
}

export const gameAPI = new GameAPI();
