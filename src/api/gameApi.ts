// Локальные сохранения на устройстве (localStorage), привязка к Telegram user_id
import { GameState } from '../hooks/useGameLogic';

class GameAPI {
  private tgId: number | null = null;
  private saving = false;

  init(tgId: number) {
    this.tgId = tgId;
  }

  isSaving() {
    return this.saving;
  }

  private storageKey() {
    return this.tgId ? `eco_empire_save_${this.tgId}` : 'eco_empire_save';
  }

  async getUserData(): Promise<GameState | null> {
    if (!this.tgId) return null;
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state as GameState;
    } catch (e) {
      console.error('Failed to load user data:', e);
      return null;
    }
  }

  // Разрешение конфликтов: если сервер новее — не перезаписываем
  async saveUserData(gameState: GameState): Promise<void> {
    if (!this.tgId) return;
    this.saving = true;
    try {
      const now = Date.now();
      const payload = { __updatedAt: now, state: gameState };
      localStorage.setItem(this.storageKey(), JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save user data:', e);
    } finally {
      this.saving = false;
    }
  }
  // В локальном режиме не отправляем статистику/логи
}

export const gameAPI = new GameAPI();
