import { useMemo } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import SeedSelectModal from './SeedSelectModal';
import LevelDisplay from './LevelDisplay';

export default function Field({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state, openSeedModal, closeSeedModal, seedSelectForCell, seedsInInventory, plantSeed, harvest, timeLeftForCell, getLevelProgress } = game;

  const { getCurrentFieldSize, getNextUpgrade, upgradeField } = game;
  const currentSize = getCurrentFieldSize();
  const nextUpgrade = getNextUpgrade();
  const gridSize = Math.sqrt(currentSize);
  const levelProgress = getLevelProgress();

  return (
    <div className="max-w-md mx-auto p-3 pt-6">

      <div className="mb-4">
        <LevelDisplay
          level={levelProgress.currentLevel}
          xp={levelProgress.currentXP}
          requiredXP={levelProgress.requiredXP}
          progress={levelProgress.progress}
          onInfoClick={() => {}}
        />
      </div>

      <div className={`grid gap-1 max-w-sm mx-auto`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {state.field.map((cell) => {
          if (cell.status === 'empty') {
            return (
              <button
                key={cell.id}
                onClick={() => openSeedModal(cell.id)}
                className="aspect-square rounded-xl bg-white shadow-md flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-0"
              >
                <span className="text-2xl">➕</span>
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
                <div className="text-xl">⏳</div>
                <div className="text-xs text-gray-600">{m}:{s}</div>
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
              <span className="text-2xl">✅</span>
            </button>
          );
        })}
      </div>

      {/* Кнопка улучшения поля */}
      {nextUpgrade && (
        <div className="mt-4 text-center">
          <button
            onClick={upgradeField}
            disabled={state.balance < nextUpgrade.cost}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Улучшить поле ({nextUpgrade.cost.toLocaleString()} $ECO)
          </button>
          <div className="text-xs text-gray-500 mt-1">
            Размер: {gridSize}×{gridSize} → {Math.sqrt(nextUpgrade.size)}×{Math.sqrt(nextUpgrade.size)}
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
    </div>
  );
}





