import { useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import SeedSelectModal from './SeedSelectModal';
import RewardsModal from './RewardsModal';
import NewsModal from './NewsModal';

export default function Field({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state, openSeedModal, closeSeedModal, seedSelectForCell, seedsInInventory, plantSeed, harvest, timeLeftForCell } = game;

  const { getCurrentFieldSize, getNextUpgrade, upgradeField } = game;
  const currentSize = getCurrentFieldSize();
  const nextUpgrade = getNextUpgrade();
  const gridSize = Math.sqrt(currentSize);

  const [showRewards, setShowRewards] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // Проверка можно ли улучшить поле
  const canUpgradeField = () => {
    // Проверяем есть ли растущие или готовые растения
    const hasPlants = state.field.some(cell => cell.status === 'growing' || cell.status === 'ready');
    return !hasPlants;
  };

  const handleUpgradeClick = () => {
    if (!canUpgradeField()) {
      setUpgradeError('На поле не должно быть растений! Соберите урожай перед улучшением.');
      return;
    }
    setShowUpgradeConfirm(true);
  };

  const confirmUpgrade = () => {
    upgradeField();
    setShowUpgradeConfirm(false);
  };

  // Динамические размеры для контента в зависимости от размера сетки
  const getEmojiSize = () => {
    if (gridSize <= 3) return 'text-2xl';
    if (gridSize <= 5) return 'text-xl';
    if (gridSize <= 7) return 'text-lg';
    return 'text-base';
  };

  const getTimerSize = () => {
    if (gridSize <= 3) return 'text-xs';
    if (gridSize <= 5) return 'text-[10px]';
    return 'text-[8px]';
  };

  const emojiSize = getEmojiSize();
  const timerSize = getTimerSize();

  return (
    <div className="max-w-md mx-auto p-3 pt-6">

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => setShowRewards(true)} className="py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold shadow-md hover:from-yellow-600 hover:to-yellow-700">
          🎁 Награды
        </button>
        <button onClick={() => setShowNews(true)} className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700">
          📰 Новости
        </button>
      </div>

      <div className={`grid gap-1 max-w-xs mx-auto`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {state.field.map((cell) => {
          if (cell.status === 'empty') {
            return (
              <button
                key={cell.id}
                onClick={() => openSeedModal(cell.id)}
                className="aspect-square rounded-xl bg-white shadow-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-0"
              >
                <span className={emojiSize}>➕</span>
              </button>
            );
          }
          if (cell.status === 'growing') {
            const ms = timeLeftForCell(cell);
            const sec = Math.ceil(ms / 1000);
            const m = Math.floor(sec / 60).toString();
            const s = (sec % 60).toString().padStart(2, '0');
            return (
              <div key={cell.id} className="aspect-square rounded-xl bg-white shadow-md flex flex-col items-center justify-center">
                <div className={emojiSize}>⏳</div>
                <div className={`${timerSize} text-gray-600`}>{m}:{s}</div>
              </div>
            );
          }
          // ready
          return (
            <button
              key={cell.id}
              onClick={() => harvest(cell.id)}
              className="aspect-square rounded-xl bg-[var(--accent)] shadow-md flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-0"
            >
              <span className={emojiSize}>✅</span>
            </button>
          );
        })}
      </div>

      {/* Кнопка улучшения поля */}
      {nextUpgrade && (
        <div className="mt-4 text-center">
          <button
            onClick={handleUpgradeClick}
            disabled={state.balance < nextUpgrade.cost}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Улучшить поле ({nextUpgrade.cost.toLocaleString()} $ECO)
          </button>
          <div className="text-xs text-gray-500 mt-1">
            Размер: {Math.floor(gridSize)}×{Math.floor(gridSize)} → {Math.floor(Math.sqrt(nextUpgrade.size))}×{Math.floor(Math.sqrt(nextUpgrade.size))}
          </div>
        </div>
      )}

      <SeedSelectModal
        open={seedSelectForCell !== null}
        seeds={seedsInInventory}
        onClose={closeSeedModal}
        onSelect={(seedId) => {
          if (seedSelectForCell !== null) plantSeed(seedSelectForCell, seedId as any);
        }}
      />

      <RewardsModal open={showRewards} onClose={() => setShowRewards(false)} game={game} />
      <NewsModal open={showNews} onClose={() => setShowNews(false)} />
      
      {/* Модалка подтверждения улучшения */}
      {showUpgradeConfirm && nextUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={() => setShowUpgradeConfirm(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-bold mb-3 text-center">🏗️ Улучшить поле?</div>
            <div className="text-sm text-gray-700 mb-4 text-center">
              Поле увеличится с {Math.floor(gridSize)}×{Math.floor(gridSize)} до {Math.floor(Math.sqrt(nextUpgrade.size))}×{Math.floor(Math.sqrt(nextUpgrade.size))}
            </div>
            <div className="text-base font-semibold text-center mb-4 text-[var(--primary)]">
              Стоимость: {nextUpgrade.cost.toLocaleString()} $ECO
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpgradeConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold hover:opacity-90"
              >
                Улучшить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка ошибки */}
      {upgradeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={() => setUpgradeError(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-bold mb-3 text-center text-red-600">⚠️ Невозможно улучшить</div>
            <div className="text-sm text-gray-700 mb-4 text-center">
              {upgradeError}
            </div>
            <button
              onClick={() => setUpgradeError(null)}
              className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





