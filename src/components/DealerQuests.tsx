import { useState, useMemo } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { getQuestById } from '../data/dealerQuests';
import type { DealerQuest } from '../data/dealerQuests';
import { BOOSTERS } from '../data/boosters';
import { getSeedInfo } from '../utils/hybridUtils';

interface DealerQuestsProps {
  game: ReturnType<typeof useGameLogic>;
}

export default function DealerQuests({ game }: DealerQuestsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const { state, initializeDealerQuestPage, completeDealerQuest } = game;

  // Получаем квесты для текущей страницы
  const pageQuests = useMemo(() => {
    const questIds = state.dealerQuestPages?.[currentPage] || [];
    return questIds.map(id => getQuestById(id)).filter((q): q is DealerQuest => q !== null);
  }, [state.dealerQuestPages, currentPage]);

  // Проверяем, разблокирована ли страница для выполнения (можно листать все, но выполнять только по порядку)
  const isPageAvailableForCompletion = useMemo(() => {
    if (currentPage === 1) return true;
    const prevPage = currentPage - 1;
    const prevPageQuests = state.dealerQuestPages?.[prevPage] || [];
    const prevPageCompleted = prevPageQuests.filter(id => 
      state.dealerCompletedQuests?.includes(id)
    );
    return prevPageCompleted.length === prevPageQuests.length && prevPageQuests.length === 30;
  }, [currentPage, state.dealerQuestPages, state.dealerCompletedQuests]);

  // Инициализируем страницу если нужно (можно инициализировать любую страницу)
  useMemo(() => {
    if (pageQuests.length === 0 || pageQuests.length < 30) {
      initializeDealerQuestPage(currentPage);
    }
  }, [pageQuests.length, currentPage, initializeDealerQuestPage]);

  const getQuestStatus = (questId: string): 'active' | 'locked' | 'completed' => {
    if (state.dealerCompletedQuests?.includes(questId)) {
      return 'completed';
    }
    
    // Проверяем, доступна ли страница для выполнения
    if (!isPageAvailableForCompletion && currentPage > 1) {
      return 'locked'; // Страница заблокирована - предыдущая не выполнена
    }
    
    if (questId === state.dealerActiveQuest) {
      return 'active';
    }
    
    // Проверяем, все ли предыдущие квесты выполнены (на той же странице)
    const questIndex = pageQuests.findIndex(q => q.id === questId);
    if (questIndex === 0) {
      // Первый квест страницы активен только если это первая страница или предыдущая выполнена
      return isPageAvailableForCompletion ? 'active' : 'locked';
    }
    
    const prevQuests = pageQuests.slice(0, questIndex);
    const allPrevCompleted = prevQuests.every(q => 
      state.dealerCompletedQuests?.includes(q.id)
    );
    
    return allPrevCompleted ? 'active' : 'locked';
  };

  const getQuestProgress = (quest: DealerQuest): number => {
    const progress = state.dealerQuestProgress?.[quest.id] || 0;
    return Math.min(progress, quest.target);
  };

  const handleQuestClick = (questId: string) => {
    const status = getQuestStatus(questId);
    if (status === 'active') {
      setSelectedQuestId(questId);
    }
  };

  const handleCompleteQuest = () => {
    if (selectedQuestId) {
      completeDealerQuest(selectedQuestId);
      setSelectedQuestId(null);
    }
  };

  const selectedQuest = selectedQuestId ? getQuestById(selectedQuestId) : null;
  const questProgress = selectedQuest ? getQuestProgress(selectedQuest) : 0;
  const questCompleted = selectedQuest ? questProgress >= selectedQuest.target : false;

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Заголовок и уровень скупщика */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Квесты скупщика</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 text-lg"
            title="Информация о квестах"
          >
            ℹ️
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span>Уровень скупщика: <strong>{state.dealerLevel || 1}</strong></span>
          <span className="text-gray-500">|</span>
          <span>Опыт: <strong>{state.dealerXP || 0}</strong></span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Множитель цены: <strong>+{((state.dealerLevel || 1) - 1) * 5}%</strong>
        </div>
      </div>

      {/* Навигация страниц */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <span className="text-sm font-medium">Страница {currentPage} / 6</span>
        <button
          onClick={() => setCurrentPage(Math.min(6, currentPage + 1))}
          disabled={currentPage === 6}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Вперед →
        </button>
      </div>

      {/* Сетка квестов 6x5 */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {pageQuests.slice(0, 30).map((quest) => {
          const status = getQuestStatus(quest.id);
          const progress = getQuestProgress(quest);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';
          const isLocked = status === 'locked';

          let bgColor = 'bg-gray-300';
          let emoji = '❌';
          let borderColor = 'border-gray-400';

          if (isCompleted) {
            bgColor = 'bg-green-500';
            emoji = '✅';
            borderColor = 'border-green-600';
          } else if (isActive) {
            bgColor = 'bg-orange-500';
            emoji = '⏳';
            borderColor = 'border-orange-600';
          } else {
            bgColor = 'bg-red-500';
            emoji = '🔒';
            borderColor = 'border-red-600';
          }

          return (
            <button
              key={quest.id}
              onClick={() => handleQuestClick(quest.id)}
              disabled={isLocked}
              className={`w-full aspect-square ${bgColor} ${borderColor} border-2 rounded-lg flex flex-col items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95`}
              title={quest.description}
            >
              <span className="text-lg mb-1">{emoji}</span>
              {isActive && (
                <span className="text-[8px] font-bold text-white">
                  {progress}/{quest.target}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Модалка квеста */}
      {selectedQuest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuestId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">{selectedQuest.description}</h3>
            
            {/* Прогресс */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс:</span>
                <span className="font-bold">{questProgress} / {selectedQuest.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    questCompleted ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (questProgress / selectedQuest.target) * 100)}%` }}
                />
              </div>
            </div>

            {/* Награды */}
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">Награды:</div>
              <div className="space-y-1">
                <div className="text-sm">💰 {selectedQuest.rewardEco} $ECO</div>
                {selectedQuest.rewardBoosters?.map((reward, idx) => {
                  const booster = BOOSTERS[reward.boosterId];
                  return (
                    <div key={idx} className="text-sm">
                      {booster?.emoji || '⚡'} {reward.count}x {booster?.name || 'бустер'}
                    </div>
                  );
                })}
                {selectedQuest.rewardSeeds?.map((reward, idx) => {
                  const seed = getSeedInfo(reward.seedId);
                  return (
                    <div key={idx} className="text-sm">
                      {seed?.emoji || '🌱'} {reward.count}x {seed?.name || 'семян'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedQuestId(null)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
              >
                Закрыть
              </button>
              <button
                onClick={handleCompleteQuest}
                disabled={!questCompleted}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка информации о квестах */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">ℹ️ Информация о квестах</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🎯 Что такое квесты скупщика?</h4>
                <p className="text-gray-700">
                  Квесты скупщика - это специальные задания, которые помогают вам прокачивать уровень скупщика. 
                  Чем выше уровень скупщика, тем больше денег вы получаете за продажу плодов!
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📊 Как работает система?</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Всего 6 страниц квестов, по 30 квестов на каждой</li>
                  <li>Квесты открываются по порядку - следующий доступен после выполнения предыдущего</li>
                  <li>За квесты на странице 1 даётся 1 опыт, на странице 2 - 2 опыта, и так далее</li>
                  <li>Для открытия следующей страницы нужно выполнить все 30 квестов предыдущей</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💰 Уровни скупщика</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Максимальный уровень: 7</li>
                  <li>Пороги опыта: 30, 60, 90, 120, 150, 180</li>
                  <li>Каждый уровень даёт +5% к цене продажи плодов (накопительно)</li>
                  <li>Например: уровень 3 = +10% к цене (1.05 × 1.05)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎁 Награды за квесты</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>💰 $ECO - основная валюта игры</li>
                  <li>⚡ Бустеры - ускорители роста, лейки, удобрения</li>
                  <li>🌱 Семена - различные семена для посадки</li>
                  <li>📈 Опыт скупщика - повышает уровень скупщика</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎮 Типы квестов</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>🌱 Посадить семена - посадить определённое количество семян</li>
                  <li>🍎 Продать плоды - продать определённое количество конкретных плодов</li>
                  <li>💰 Продать на сумму - заработать определённую сумму $ECO (учитываются только продажи после начала квеста)</li>
                  <li>🌾 Вырастить семена - собрать готовые плоды с растений</li>
                  <li>🔬 Создать гибриды - создать гибридные семена</li>
                  <li>🧬 Выполнить синтез - создать синтезные растения</li>
                  <li>⚡ Использовать бустеры - применить бустеры определённого типа</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

