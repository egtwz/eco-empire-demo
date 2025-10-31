import { GameState } from '../hooks/useGameLogic';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function appendDebugLog(message: string, data?: unknown) {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('debug-log');
  if (!container) return;

  const timestamp = new Date().toLocaleTimeString();
  const text = data ? `${message} ${JSON.stringify(data)}` : message;
  container.textContent = `${container.textContent ? container.textContent + '\n' : ''}[${timestamp}] ${text}`;
  container.scrollTop = container.scrollHeight;
}

class GameAPI {
  private tgId: number | null = null;
  private initData: string | null = null;
  private saving = false;
  private lastServerUpdatedAt: number | null = null;

  init(tgId: number, initData?: string | null) {
    this.tgId = tgId;
    if (typeof initData === 'string') {
      this.initData = initData;
    }
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

  async saveUserData(gameState: GameState): Promise<void> {
    if (!this.tgId) return;

    this.saving = true;
    const updatedAt = Date.now();
    this.persistLocal(gameState, updatedAt);

    const startPayload = {
      tgId: this.tgId,
      hasInitData: !!this.initData,
      updatedAt,
    };
    console.log('[gameAPI] saveUserData start', startPayload);
    appendDebugLog('[save start]', startPayload);

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

      appendDebugLog('[save request]', { url, headers, body });

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
      appendDebugLog('[save response]', { status: response.status, body: errorText });

      if (response.status === 409) {
        const conflict = await response.json();
        this.lastServerUpdatedAt = conflict.updated_at ?? this.lastServerUpdatedAt;
        console.warn('Server state is newer, consider resolving conflict');
        return;
      }

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const result = await response.json();
      this.lastServerUpdatedAt = result?.updated_at ?? updatedAt;
    } catch (error) {
      console.error('Failed to save user data to API', error);
    } finally {
      this.saving = false;
    }
  }
}

export const gameAPI = new GameAPI();
