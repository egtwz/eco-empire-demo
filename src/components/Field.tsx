import { useMemo, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import SeedSelectModal from './SeedSelectModal';
import House from './House';
import { SYNTHESIS_PLANTS, SYNTHESIS_RECIPES } from '../data/synthesis';
import { RARITY_COLORS } from '../data/seeds';
import { BOOSTERS, BoosterId } from '../data/boosters';
import BoosterSelectModal from './BoosterSelectModal';

export default function Field({ game, fieldViewMode }: { game: ReturnType<typeof useGameLogic>; fieldViewMode: 'field' | 'house' }) {
  const { state, openSeedModal, closeSeedModal, seedSelectForCell, seedsInInventory, plantSeed, harvest, timeLeftForCell, addItemToInventory, startSynthesis, completeSynthesis } = game;

  const { getCurrentFieldSize, getNextUpgrade, upgradeField } = game;
  const currentSize = getCurrentFieldSize();
  const nextUpgrade = getNextUpgrade();
  const gridSize = Math.sqrt(currentSize);

  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [boosterCellId, setBoosterCellId] = useState<number | null>(null);
  const [boosterBlockReason, setBoosterBlockReason] = useState<string | null>(null);

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

  const targetedBoosters = useMemo(() => {
    return Object.values(BOOSTERS)
      .filter((booster) => booster.usage === 'target')
      .map((booster) => ({
        def: booster,
        count: state.inventory.find((item) => item.id === booster.id)?.count ?? 0,
      }));
  }, [state.inventory]);

  const hasTargetedBoosters = targetedBoosters.some((booster) => booster.count > 0);

  const handleOpenBoosterMenu = (cellIndex: number) => {
    const cell = state.field[cellIndex];

    if (!hasTargetedBoosters) {
      setBoosterBlockReason('У вас нет бустеров, которые можно применить к растениям.');
      setBoosterCellId(cellIndex);
      return;
    }

    const isFrozenBySynthesis = Boolean(cell?.frozenUntil && Date.now() < cell.frozenUntil);
    if (isFrozenBySynthesis) {
      setBoosterBlockReason('Нельзя применить бустер, пока рядом идёт синтез. Подождите завершения процесса.');
      setBoosterCellId(cellIndex);
      return;
    }

    setBoosterBlockReason(null);
    setBoosterCellId(cellIndex);
  };

  const handleSelectBoosterForCell = (boosterId: BoosterId) => {
    if (boosterCellId === null || boosterBlockReason) {
      setBoosterCellId(null);
      setBoosterBlockReason(null);
      return;
    }
    game.applyBooster(boosterId, boosterCellId);
    setBoosterCellId(null);
    setBoosterBlockReason(null);
  };

  const closeBoosterModal = () => {
    setBoosterCellId(null);
    setBoosterBlockReason(null);
  };

  // Находим возможные рецепты синтеза на основе соседних растений
  const getAvailableSynthesisRecipes = (cellId: number): string[] => {
    // Только для пустых клеток и уровня 2+
    if (state.field[cellId].status !== 'empty' || state.level < 2) return [];
    
    const row = Math.floor(cellId / gridSize);
    const col = cellId % gridSize;
    
    // Проверяем 4 соседние клетки (вверх, вниз, влево, вправо)
    const neighbors = [
      row > 0 ? state.field[cellId - gridSize] : null, // вверх
      row < gridSize - 1 ? state.field[cellId + gridSize] : null, // вниз
      col > 0 ? state.field[cellId - 1] : null, // влево
      col < gridSize - 1 ? state.field[cellId + 1] : null, // вправо
    ].filter((cell): cell is NonNullable<typeof cell> => !!cell && cell.status === 'growing'); // только растущие
    
    // Должно быть ровно 4 растения и ни одного созревшего
    if (neighbors.length !== 4) return [];
    
    // Собираем массив seedId из соседних растений
    const neighborSeeds = neighbors.map(cell => cell.seed).filter(Boolean) as string[];
    
    // Проверяем каждый рецепт
    const availableRecipes: string[] = [];
    for (const recipe of SYNTHESIS_RECIPES) {
      const requiredCounts = new Map<string, number>();
      recipe.requiredPlants.forEach(req => {
        requiredCounts.set(req.seedId, req.count);
      });
      
      // Проверяем есть ли все необходимые растения в нужном количестве
      const neighborCounts = new Map<string, number>();
      neighborSeeds.forEach(seedId => {
        neighborCounts.set(seedId, (neighborCounts.get(seedId) || 0) + 1);
      });
      
      let canCraft = true;
      for (const [seedId, requiredCount] of requiredCounts) {
        if ((neighborCounts.get(seedId) || 0) < requiredCount) {
          canCraft = false;
          break;
        }
      }
      
      if (canCraft) {
        availableRecipes.push(recipe.resultId);
      }
    }
    
    return availableRecipes;
  };

  // Проверяем, может ли клетка быть центром синтеза
  const canDoSynthesis = (cellId: number) => {
    return getAvailableSynthesisRecipes(cellId).length > 0;
  };

  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [synthesisCellId, setSynthesisCellId] = useState<number | null>(null);
  const [selectedSynthesisPlant, setSelectedSynthesisPlant] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{ success: boolean; plantId: string; cellId: number } | null>(null);

  const handleSynthesisClick = (cellId: number) => {
    setSynthesisCellId(cellId);
    setShowSynthesisModal(true);
  };

  const getAvailableRecipes = () => {
    if (synthesisCellId === null) return [];
    return getAvailableSynthesisRecipes(synthesisCellId);
  };

  const handleStartSynthesis = () => {
    if (!selectedSynthesisPlant || synthesisCellId === null) return;
    const plant = SYNTHESIS_PLANTS.find(p => p.id === selectedSynthesisPlant);
    // Генерируем случайное число для успеха сразу
    const willSucceed = Math.random() * 100 < (plant?.successChance || 0);
    startSynthesis(synthesisCellId, selectedSynthesisPlant, willSucceed, gridSize);
    setShowSynthesisModal(false);
    setSelectedSynthesisPlant(null);
  };

  const handleHarvestSynthesis = (cellId: number) => {
    const synthesis = state.synthesisActive?.find(s => s.cellId === cellId);
    if (!synthesis) return;
    
    const plant = SYNTHESIS_PLANTS.find(p => p.id === synthesis.plantId);
    if (!plant) return;
    
    // Показываем модалку с результатом
    setResultData({ success: synthesis.willSucceed, plantId: synthesis.plantId, cellId });
    setShowResultModal(true);
  };
  
  const handleCollectFruit = () => {
    if (!resultData) return;
    
    const plant = SYNTHESIS_PLANTS.find(p => p.id === resultData.plantId);
    if (!plant) return;
    
    // Добавляем плод в инвентарь
    addItemToInventory({
      id: plant.id,
      name: plant.name,
      type: 'fruit' as const,
      emoji: plant.emoji
    }, 1);
    
    // Убираем синтез
    completeSynthesis(resultData.cellId);
    setShowResultModal(false);
    setResultData(null);
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-0 pb-3">
      {fieldViewMode === 'field' ? (
        <>
          <div className={`grid gap-1 w-full mx-auto -mt-2`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {state.field.map((cell) => {
          // Проверяем есть ли активный синтез на этой клетке
          const activeSynthesis = state.synthesisActive?.find(s => s.cellId === cell.id);
          
          if (cell.status === 'empty') {
            const canSynthesis = canDoSynthesis(cell.id) && !activeSynthesis;
            
            // Если синтез завершен успешно - показываем готовый плод
            if (activeSynthesis) {
              const plant = SYNTHESIS_PLANTS.find(p => p.id === activeSynthesis.plantId);
              const elapsed = Date.now() - activeSynthesis.startTime;
              const growMs = plant ? plant.growSeconds * 1000 : 120000;
              
              if (elapsed >= growMs) {
                // Синтез завершен - показываем фиолетовую галочку
                return (
                  <button
                    key={cell.id}
                    onClick={() => handleHarvestSynthesis(cell.id)}
                    className="aspect-square rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-0 animate-pulse"
                  >
                    <span className={emojiSize}>✅</span>
                  </button>
                );
              } else {
                // Синтез еще идет
                const remaining = growMs - elapsed;
                const sec = Math.ceil(remaining / 1000);
                const m = Math.floor(sec / 60).toString();
                const s = (sec % 60).toString().padStart(2, '0');
                return (
                  <div key={cell.id} className="aspect-square rounded-xl bg-gradient-to-br from-purple-300 to-indigo-400 shadow-md flex flex-col items-center justify-center">
                    <div className={emojiSize}>🧬</div>
                    <div className={`${timerSize} text-white`}>{m}:{s}</div>
                  </div>
                );
              }
            }
            
            return (
              <button
                key={cell.id}
                onClick={() => canSynthesis ? handleSynthesisClick(cell.id) : openSeedModal(cell.id)}
                className={`aspect-square rounded-xl shadow-md flex items-center justify-center focus:outline-none focus:ring-0 transition-all ${
                  canSynthesis 
                    ? 'bg-gradient-to-br from-purple-400 to-indigo-500 animate-pulse hover:from-purple-500 hover:to-indigo-600' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className={emojiSize}>{canSynthesis ? '🧬' : '➕'}</span>
              </button>
            );
          }
          if (cell.status === 'growing') {
            const ms = timeLeftForCell(cell);
            const sec = Math.ceil(ms / 1000);
            const m = Math.floor(sec / 60).toString();
            const s = (sec % 60).toString().padStart(2, '0');
            return (
              <button
                key={cell.id}
                onClick={() => handleOpenBoosterMenu(cell.id)}
                className={`aspect-square rounded-xl bg-white shadow-md flex flex-col items-center justify-center focus:outline-none focus:ring-0 transition-all ${
                  hasTargetedBoosters ? 'hover:bg-gray-50 active:scale-95' : ''
                }`}
              >
                <div className={emojiSize}>⏳</div>
                <div className={`${timerSize} text-gray-600`}>{m}:{s}</div>
              </button>
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
        </>
      ) : (
        <House game={game} />
      )}

      <SeedSelectModal
        open={seedSelectForCell !== null}
        seeds={seedsInInventory}
        onClose={closeSeedModal}
        onSelect={(seedId) => {
          if (seedSelectForCell !== null) plantSeed(seedSelectForCell, seedId as any);
        }}
      />

      <BoosterSelectModal
        open={boosterCellId !== null}
        boosters={targetedBoosters}
        onClose={closeBoosterModal}
        onSelect={handleSelectBoosterForCell}
        selectedCell={boosterCellId !== null ? state.field[boosterCellId] : null}
        timeLeft={boosterCellId !== null ? timeLeftForCell(state.field[boosterCellId]) : null}
        blockedReason={boosterBlockReason}
      />
      
      {/* Модалка подтверждения улучшения */}
      {showUpgradeConfirm && nextUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3" onClick={() => setShowUpgradeConfirm(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3" onClick={() => setUpgradeError(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

      {/* Модалка синтеза */}
      {showSynthesisModal && synthesisCellId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3" onClick={() => { setShowSynthesisModal(false); setSynthesisCellId(null); setSelectedSynthesisPlant(null); }}>
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-bold mb-3 text-center">🧬 Синтез растений</div>
            <div className="text-sm text-gray-600 mb-4 text-center">
              Выберите растение для синтеза
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {(() => {
                const availableRecipes = getAvailableRecipes();
                const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
                return SYNTHESIS_PLANTS
                  .filter(plant => availableRecipes.includes(plant.id))
                  .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
                  .map(plant => {
                    const recipe = SYNTHESIS_RECIPES.find(r => r.resultId === plant.id);
                    const isLocked = state.level < plant.minLevel;
                    return (
                      <button
                        key={plant.id}
                        onClick={() => !isLocked && setSelectedSynthesisPlant(plant.id)}
                        disabled={isLocked}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left relative ${
                          isLocked
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : selectedSynthesisPlant === plant.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {isLocked && (
                          <div className="absolute top-2 right-2 text-xl">🔒</div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{plant.emoji}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-medium text-white"
                                  style={{ backgroundColor: RARITY_COLORS[plant.rarity] }}
                                >
                                  {plant.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{recipe?.description || plant.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isLocked ? (
                              <div className="text-xs text-gray-500">С {plant.minLevel} ур.</div>
                            ) : (
                              <>
                                <div className="text-sm font-bold text-green-600">{plant.successChance}%</div>
                                <div className="text-xs text-gray-500">шанс</div>
                                <div className="text-xs text-green-600">{plant.sellPrice.toLocaleString()} $ECO</div>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  });
              })()}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSynthesisModal(false); setSynthesisCellId(null); setSelectedSynthesisPlant(null); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={handleStartSynthesis}
                disabled={!selectedSynthesisPlant}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Начать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка результата синтеза */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 p-3" onClick={() => { setShowResultModal(false); setResultData(null); }}>
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {resultData.success ? (
              <>
                <div className="text-lg font-bold mb-3 text-center text-green-600">✨ Успех!</div>
                <div className="text-6xl text-center mb-3">{SYNTHESIS_PLANTS.find(p => p.id === resultData.plantId)?.emoji}</div>
                <div className="text-base text-gray-700 mb-4 text-center">
                  Вы получили: {SYNTHESIS_PLANTS.find(p => p.id === resultData.plantId)?.name}
                </div>
                <div className="text-sm text-gray-600 mb-4 text-center">
                  Цена продажи: <span className="font-bold text-green-600">{SYNTHESIS_PLANTS.find(p => p.id === resultData.plantId)?.sellPrice.toLocaleString()} $ECO</span>
                </div>
                <button
                  onClick={handleCollectFruit}
                  className="w-full py-2.5 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600"
                >
                  Получить плод
                </button>
              </>
            ) : (
              <>
                <div className="text-lg font-bold mb-3 text-center text-red-600">❌ Неудача</div>
                <div className="text-6xl text-center mb-3">😞</div>
                <div className="text-base text-gray-700 mb-4 text-center">
                  К сожалению, синтез не удался
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      completeSynthesis(resultData.cellId);
                      setShowResultModal(false);
                      setResultData(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                  >
                    Попробовать снова
                  </button>
                  <button
                    onClick={() => {
                      completeSynthesis(resultData.cellId);
                      setShowResultModal(false);
                      setResultData(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
                  >
                    Закрыть
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





