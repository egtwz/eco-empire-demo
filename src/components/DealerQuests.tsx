import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import { getQuestById } from '../data/dealerQuests';
import type { DealerQuest } from '../data/dealerQuests';
import { BOOSTERS } from '../data/boosters';
import { getSeedInfo } from '../utils/hybridUtils';

interface DealerQuestsProps {
  game: ReturnType<typeof useGameLogic>;
}

type QuestTab = 'main' | 'daily' | 'weekly';

export default function DealerQuests({ game }: DealerQuestsProps) {
  const [activeTab, setActiveTab] = useState<QuestTab>('main');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDealerLevelModal, setShowDealerLevelModal] = useState(false);
  
  const { state, initializeDealerQuestPage, completeDealerQuest } = game;

  // Функция для получения требуемого XP для следующего уровня (накопительно: N × 50)
  const getRequiredXPForLevel = (level: number): number => {
    return level * 50; // Для уровня N нужно N × 50 XP накопительно
  };

  const dealerLevel = state.dealerLevel || 1;
  const dealerXP = state.dealerXP || 0;
  const maxLevel = 20;
  const currentLevelXP = dealerLevel === 1 ? 0 : getRequiredXPForLevel(dealerLevel - 1);
  const nextLevelXP = dealerLevel < maxLevel ? getRequiredXPForLevel(dealerLevel) : Infinity;
  const progressXP = dealerLevel < maxLevel ? (dealerXP - currentLevelXP) : 0;
  const requiredXP = dealerLevel < maxLevel ? (nextLevelXP - currentLevelXP) : 0;
  const levelProgress = dealerLevel < maxLevel && requiredXP > 0 ? (progressXP / requiredXP) * 100 : 100;

  // Получаем квесты для текущей страницы (основные)
  const pageQuests = useMemo(() => {
    if (activeTab !== 'main') return [];
    const questIds = state.dealerQuestPages?.[currentPage] || [];
    return questIds.map(id => getQuestById(id)).filter((q): q is DealerQuest => q !== null && typeof q.page === 'number');
  }, [state.dealerQuestPages, currentPage, activeTab]);

  // Получаем ежедневный квест
  const dailyQuest = useMemo(() => {
    if (activeTab !== 'daily') return null;
    const questId = state.dealerDailyQuestId;
    if (!questId) return null;
    return getQuestById(questId);
  }, [state.dealerDailyQuestId, activeTab]);

  // Получаем еженедельный квест
  const weeklyQuest = useMemo(() => {
    if (activeTab !== 'weekly') return null;
    const questId = state.dealerWeeklyQuestId;
    if (!questId) return null;
    return getQuestById(questId);
  }, [state.dealerWeeklyQuestId, activeTab]);

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

  // Инициализируем страницу если нужно (только для основных)
  useMemo(() => {
    if (activeTab === 'main' && (pageQuests.length === 0 || pageQuests.length < 30)) {
      initializeDealerQuestPage(currentPage);
    }
  }, [pageQuests.length, currentPage, initializeDealerQuestPage, activeTab]);

  const getQuestStatus = (questId: string): 'active' | 'locked' | 'completed' => {
    if (state.dealerCompletedQuests?.includes(questId)) {
      return 'completed';
    }
    
    // Для основных квестов проверяем доступность страницы
    if (activeTab === 'main') {
      if (!isPageAvailableForCompletion && currentPage > 1) {
        return 'locked';
      }
      
      if (questId === state.dealerActiveQuest) {
        return 'active';
      }
      
      const questIndex = pageQuests.findIndex(q => q.id === questId);
      if (questIndex === 0) {
        return isPageAvailableForCompletion ? 'active' : 'locked';
      }
      
      const prevQuests = pageQuests.slice(0, questIndex);
      const allPrevCompleted = prevQuests.every(q => 
        state.dealerCompletedQuests?.includes(q.id)
      );
      
      return allPrevCompleted ? 'active' : 'locked';
    }
    
    // Для ежедневных/еженедельных квестов - всегда активны
    return 'active';
  };

  const getQuestProgress = (quest: DealerQuest): number => {
    if (quest.page === 'daily') {
      return state.dealerDailyQuestProgress || 0;
    } else if (quest.page === 'weekly') {
      return state.dealerWeeklyQuestProgress || 0;
    } else {
      const progress = state.dealerQuestProgress?.[quest.id] || 0;
      return Math.min(progress, quest.target);
    }
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

  // Вычисляем множитель наград для ежедневных/еженедельных
  const getRewardMultiplier = (quest: DealerQuest | null): number => {
    if (!quest) return 1;
    if (quest.page === 'daily') return 5;
    if (quest.page === 'weekly') return 10;
    return 1;
  };

  const rewardMultiplier = selectedQuest ? getRewardMultiplier(selectedQuest) : 1;

  return (
    <div className="max-w-md mx-auto p-4 pb-24" style={{ paddingTop: '28px' }}>
      {/* Окно с уровнем и XP скупщика */}
      <div 
        className="mb-4 bg-white rounded-xl p-4 shadow-lg border-2 border-blue-200 cursor-pointer hover:shadow-xl transition-all"
        onClick={() => setShowDealerLevelModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-gray-600">Уровень скупщика</div>
            <div className="text-2xl font-bold text-blue-600">{dealerLevel}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Опыт</div>
            <div className="text-lg font-semibold">
              {progressXP} / {requiredXP > 0 ? requiredXP : 'MAX'}
            </div>
          </div>
        </div>
        
        {/* Прогресс-бар уровня */}
        {dealerLevel < maxLevel && (
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, levelProgress)}%` }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Множитель цены: <strong className="text-blue-600">+{((dealerLevel - 1) * 5).toFixed(0)}%</strong></span>
          {dealerLevel < maxLevel && (
            <span>До уровня {dealerLevel + 1}: <strong>{requiredXP - progressXP}</strong> XP</span>
          )}
        </div>
      </div>

      {/* Заголовок и кнопка информации */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Квесты скупщика</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 text-lg"
            title="Информация о квестах"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => {
            setActiveTab('main');
            setSelectedQuestId(null);
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'main'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Основные
        </button>
        <button
          onClick={() => {
            setActiveTab('daily');
            setSelectedQuestId(null);
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ежедневные
        </button>
        <button
          onClick={() => {
            setActiveTab('weekly');
            setSelectedQuestId(null);
          }}
          className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'weekly'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Еженедельные
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'main' && (
        <>
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

              if (isCompleted) {
                bgColor = 'bg-green-500';
                emoji = '✅';
              } else if (isActive) {
                bgColor = 'bg-orange-500';
                emoji = '⏳';
              } else {
                bgColor = 'bg-red-500';
                emoji = '🔒';
              }

              return (
                <button
                  key={quest.id}
                  onClick={() => handleQuestClick(quest.id)}
                  disabled={isLocked}
                  className={`w-full aspect-square ${bgColor} rounded-lg flex flex-col items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95`}
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
        </>
      )}

      {activeTab === 'daily' && dailyQuest && (
        <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-orange-600">📅 Ежедневный квест</h3>
            <span className="text-xs text-gray-500">Обновляется в 00:00 МСК</span>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">{dailyQuest.description}</p>
            <div className="flex justify-between text-xs mb-1">
              <span>Прогресс:</span>
              <span className="font-bold">{state.dealerDailyQuestProgress || 0} / {dailyQuest.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  (state.dealerDailyQuestProgress || 0) >= dailyQuest.target ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, ((state.dealerDailyQuestProgress || 0) / dailyQuest.target) * 100)}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-600 mb-3">
            <div className="font-semibold mb-1">Награды (×5):</div>
            <div>💰 {dailyQuest.rewardEco * 5} $ECO</div>
            {dailyQuest.rewardBoosters?.map((reward, idx) => (
              <div key={idx}>
                {BOOSTERS[reward.boosterId]?.emoji || '⚡'} {reward.count * 5}x {BOOSTERS[reward.boosterId]?.name || 'бустер'}
              </div>
            ))}
            {dailyQuest.rewardSeeds?.map((reward, idx) => {
              const seed = getSeedInfo(reward.seedId);
              return (
                <div key={idx}>
                  {seed?.emoji || '🌱'} {reward.count * 5}x {seed?.name || 'семян'}
                </div>
              );
            })}
            <div className="mt-1 text-orange-600">⚡ +10 XP скупщика</div>
          </div>

          <button
            onClick={() => handleQuestClick(dailyQuest.id)}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
          >
            {((state.dealerDailyQuestProgress || 0) >= dailyQuest.target) ? 'Завершить квест' : 'Подробнее'}
          </button>
        </div>
      )}

      {activeTab === 'weekly' && weeklyQuest && (
        <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-purple-600">📆 Еженедельный квест</h3>
            <span className="text-xs text-gray-500">Обновляется в понедельник 00:00 МСК</span>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">{weeklyQuest.description}</p>
            <div className="flex justify-between text-xs mb-1">
              <span>Прогресс:</span>
              <span className="font-bold">{state.dealerWeeklyQuestProgress || 0} / {weeklyQuest.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  (state.dealerWeeklyQuestProgress || 0) >= weeklyQuest.target ? 'bg-green-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, ((state.dealerWeeklyQuestProgress || 0) / weeklyQuest.target) * 100)}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-600 mb-3">
            <div className="font-semibold mb-1">Награды (×10):</div>
            <div>💰 {weeklyQuest.rewardEco * 10} $ECO</div>
            {weeklyQuest.rewardBoosters?.map((reward, idx) => (
              <div key={idx}>
                {BOOSTERS[reward.boosterId]?.emoji || '⚡'} {reward.count * 10}x {BOOSTERS[reward.boosterId]?.name || 'бустер'}
              </div>
            ))}
            {weeklyQuest.rewardSeeds?.map((reward, idx) => {
              const seed = getSeedInfo(reward.seedId);
              return (
                <div key={idx}>
                  {seed?.emoji || '🌱'} {reward.count * 10}x {seed?.name || 'семян'}
                </div>
              );
            })}
            <div className="mt-1 text-purple-600">⚡ +50 XP скупщика</div>
          </div>

          <button
            onClick={() => handleQuestClick(weeklyQuest.id)}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
          >
            {((state.dealerWeeklyQuestProgress || 0) >= weeklyQuest.target) ? 'Завершить квест' : 'Подробнее'}
          </button>
        </div>
      )}

      {activeTab === 'daily' && !dailyQuest && (
        <div className="bg-white rounded-xl p-4 shadow-lg text-center text-gray-500">
          <p>Ежедневный квест появится после 00:00 МСК</p>
        </div>
      )}

      {activeTab === 'weekly' && !weeklyQuest && (
        <div className="bg-white rounded-xl p-4 shadow-lg text-center text-gray-500">
          <p>Еженедельный квест появится в понедельник 00:00 МСК</p>
        </div>
      )}

      {/* Модалка квеста */}
      {selectedQuest && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuestId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
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
              <div className="text-sm font-semibold mb-2">
                Награды{rewardMultiplier > 1 ? ` (×${rewardMultiplier})` : ''}:
              </div>
              <div className="space-y-1">
                <div className="text-sm">💰 {selectedQuest.rewardEco * rewardMultiplier} $ECO</div>
                {selectedQuest.rewardBoosters?.map((reward, idx) => {
                  const booster = BOOSTERS[reward.boosterId];
                  return (
                    <div key={idx} className="text-sm">
                      {booster?.emoji || '⚡'} {reward.count * rewardMultiplier}x {booster?.name || 'бустер'}
                    </div>
                  );
                })}
                {selectedQuest.rewardSeeds?.map((reward, idx) => {
                  const seed = getSeedInfo(reward.seedId);
                  return (
                    <div key={idx} className="text-sm">
                      {seed?.emoji || '🌱'} {reward.count * rewardMultiplier}x {seed?.name || 'семян'}
                    </div>
                  );
                })}
                {selectedQuest.page === 'daily' && <div className="text-sm text-orange-600">⚡ +10 XP скупщика</div>}
                {selectedQuest.page === 'weekly' && <div className="text-sm text-purple-600">⚡ +50 XP скупщика</div>}
                {typeof selectedQuest.page === 'number' && <div className="text-sm text-blue-600">⚡ +{selectedQuest.page} XP скупщика</div>}
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
          className="fixed inset-0 bg-gradient-to-br from-sky-400 via-blue-400 to-sky-500 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl"
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
                <h4 className="font-semibold mb-2">📊 Основные квесты</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Всего 6 страниц квестов, по 30 квестов на каждой</li>
                  <li>Квесты открываются по порядку - следующий доступен после выполнения предыдущего</li>
                  <li>За квесты на странице 1 даётся 1 опыт, на странице 2 - 2 опыта, и так далее</li>
                  <li>Для открытия следующей страницы нужно выполнить все 30 квестов предыдущей</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📅 Ежедневные квесты</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Обновляются каждый день в 00:00 МСК</li>
                  <li>Если не выполнен - сбрасывается, появляется новый</li>
                  <li>Награды увеличены в 5 раз</li>
                  <li>Дают 10 XP скупщика</li>
                  <li>Все игроки получают одинаковый квест</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📆 Еженедельные квесты</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Обновляются каждый понедельник в 00:00 МСК</li>
                  <li>Прогресс накапливается всю неделю</li>
                  <li>Награды увеличены в 10 раз</li>
                  <li>Дают 50 XP скупщика</li>
                  <li>Все игроки получают одинаковый квест</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💰 Уровни скупщика</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Максимальный уровень: 20</li>
                  <li>Формула опыта: для уровня N нужно N × 50 XP накопительно</li>
                  <li>Каждый уровень даёт +5% к цене продажи плодов (накопительно)</li>
                  <li>Например: уровень 5 = +20% к цене</li>
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
                  <li>💰 Продать на сумму - заработать определённую сумму $ECO</li>
                  <li>💸 Потратить ECO - потратить определённую сумму $ECO (любые траты)</li>
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

      {/* Модалка уровня скупщика */}
      <AnimatePresence>
        {showDealerLevelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-3"
            onClick={() => setShowDealerLevelModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-sm max-h-[66vh] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 pb-4 border-b flex-shrink-0">
                <div className="text-lg font-bold">Система уровней скупщика</div>
                <button 
                  onClick={() => setShowDealerLevelModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 min-h-0">
                <div className="p-3 bg-blue-50 rounded-xl mb-3">
                  <div className="font-semibold text-blue-800 mb-2">💰 Для чего нужен уровень скупщика:</div>
                  <p className="text-sm text-blue-900">
                    Каждый уровень скупщика увеличивает цену продажи ваших плодов на 5%. 
                    Чем выше уровень, тем больше прибыль от продаж!
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <div className="font-semibold text-orange-800 mb-2">🎯 Как получить опыт скупщика:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 1):</span>
                        <span className="font-semibold">1 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 2):</span>
                        <span className="font-semibold">2 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 3):</span>
                        <span className="font-semibold">3 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 4):</span>
                        <span className="font-semibold">4 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 5):</span>
                        <span className="font-semibold">5 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Основные квесты (страница 6):</span>
                        <span className="font-semibold">6 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📅 Ежедневные квесты:</span>
                        <span className="font-semibold">10 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📆 Еженедельные квесты:</span>
                        <span className="font-semibold">50 XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-xl">
                    <div className="font-semibold text-green-800 mb-2">📈 Требования по уровням (накопительно):</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Уровень 1→2:</span>
                        <span className="font-semibold">50 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Уровень 2→3:</span>
                        <span className="font-semibold">100 XP (всего 150)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Уровень 3→4:</span>
                        <span className="font-semibold">150 XP (всего 300)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Уровень 4→5:</span>
                        <span className="font-semibold">200 XP (всего 500)</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Формула: для уровня N нужно N × 50 XP накопительно
                      </div>
                      <div className="text-xs text-gray-600">
                        Максимальный уровень: <strong>20</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl">
                    <div className="font-semibold text-purple-800 mb-2">💎 Бонусы уровня:</div>
                    <div className="space-y-1 text-purple-900">
                      <div>• Каждый уровень: +5% к цене продажи (накопительно)</div>
                      <div>• Уровень 5 = +20% к цене</div>
                      <div>• Уровень 10 = +45% к цене</div>
                      <div>• Уровень 20 = +95% к цене</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-4 border-t">
                <button 
                  onClick={() => setShowDealerLevelModal(false)}
                  className="w-full py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
