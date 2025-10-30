import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { SYNTHESIS_PLANTS, SYNTHESIS_RECIPES, SynthesisRarity } from '../data/synthesis';
import { RARITY_COLORS } from '../data/seeds';

type InfoSection = 'gameplay' | 'rarity' | 'hybrids' | 'synthesis' | 'shop' | 'levels' | 'rewards' | 'profile' | 'exchange' | 'tips';

export default function NewsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedSection, setSelectedSection] = useState<InfoSection | null>(null);
  const [showSynthesisPlantsModal, setShowSynthesisPlantsModal] = useState(false);

  const sections = [
    { id: 'gameplay', emoji: '🌱', title: 'Основной геймплей', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-900' },
    { id: 'rarity', emoji: '🎲', title: 'Система редкости', bgColor: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-900' },
    { id: 'hybrids', emoji: '🔬', title: 'Создание гибридов', bgColor: 'from-purple-50 to-purple-100', borderColor: 'border-purple-200', textColor: 'text-purple-900' },
    { id: 'synthesis', emoji: '🧬', title: 'Синтез', bgColor: 'from-indigo-50 to-indigo-100', borderColor: 'border-indigo-200', textColor: 'text-indigo-900' },
    { id: 'shop', emoji: '🛒', title: 'Магазин', bgColor: 'from-yellow-50 to-yellow-100', borderColor: 'border-yellow-200', textColor: 'text-yellow-900' },
    { id: 'levels', emoji: '📈', title: 'Система уровней', bgColor: 'from-pink-50 to-pink-100', borderColor: 'border-pink-200', textColor: 'text-pink-900' },
    { id: 'rewards', emoji: '🎁', title: 'Система наград', bgColor: 'from-indigo-50 to-indigo-100', borderColor: 'border-indigo-200', textColor: 'text-indigo-900' },
    { id: 'profile', emoji: '👤', title: 'Профиль и статистика', bgColor: 'from-teal-50 to-teal-100', borderColor: 'border-teal-200', textColor: 'text-teal-900' },
    { id: 'exchange', emoji: '📈', title: 'Биржа', bgColor: 'from-orange-50 to-orange-100', borderColor: 'border-orange-200', textColor: 'text-orange-900' },
    { id: 'tips', emoji: '💡', title: 'Советы для успеха', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-200', textColor: 'text-red-900' },
  ] as const;

  const getSectionContent = (section: InfoSection) => {
    switch (section) {
      case 'gameplay':
        return (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
            <div className="font-semibold text-green-800 mb-2">🌱 Основной геймплей</div>
            <div className="text-sm text-green-900 space-y-2">
              <p><strong>Выращивание растений:</strong> Нажмите на пустую ячейку поля, выберите семена из инвентаря и посадите их. Растения растут в реальном времени, а урожай можно собирать нажатием на зелёную галочку.</p>
              <p><strong>Продажа урожая:</strong> Собранные плоды автоматически попадают в инвентарь. Откройте инвентарь, выберите плоды и продайте их скупщику за $ECO.</p>
              <p><strong>Улучшение поля:</strong> Когда поле пустое, можно улучшить его за $ECO, увеличив количество ячеек с 3×3 до 8×8 (максимум).</p>
            </div>
          </div>
        );
      case 'rarity':
        return (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="font-semibold text-blue-800 mb-2">🎲 Система редкости</div>
            <ul className="text-sm text-blue-900 list-disc pl-5 space-y-1">
              <li><strong>Обычные (серый):</strong> 8-50 $ECO - дуб 🌰, лилия 🌸, подсолнух 🌻, гриб 🍄, ягода 🫐, морковь 🥕, картофель 🥔, помидор 🍅</li>
              <li><strong>Необычные (зелёный):</strong> 25-60 $ECO - ель 🌲, роза 🌹, кактус 🌵, перец 🫑, кукуруза 🌽, пшеница 🌾, рис 🌾, фасоль 🫘</li>
              <li><strong>Редкие (синий):</strong> 100-200 $ECO - бамбук 🎋, вишня 🍒, яблоко 🍎, тыква 🎃, огурец 🥒, салат 🥬, лук 🧅, чеснок 🧄</li>
              <li><strong>Эпические (фиолетовый):</strong> 300-500 $ECO - виноград 🍇, дракон 🐉, шпинат 🥬, брокколи 🥦, клубника 🍓, черника 🫐, малина 🫐</li>
              <li><strong>Легендарные (оранжевый):</strong> 5000+ $ECO - феникс 🔥, арбуз 🍉</li>
            </ul>
          </div>
        );
      case 'hybrids':
        return (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
            <div className="font-semibold text-purple-800 mb-2">🔬 Создание гибридов (уровень 2+)</div>
            <div className="text-sm text-purple-900 space-y-2">
              <p>В разделе "Инвентарь" → "Создать гибрид" можно комбинировать семена и плоды для создания уникальных гибридов!</p>
              <p><strong>Тиры гибридов:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Тир 1 (уровень 2+):</strong> Золотое яблоко ✨, Радужная роза 🌈, Кристальный бамбук 💎 и др.</li>
                <li><strong>Тир 2 (уровень 2+):</strong> Солнечный плод ☀️, Ледяной кристалл 🧊, Громовая лоза ⚡ и др.</li>
                <li><strong>Тир 3 (уровень 3+):</strong> Небесный цветок 🌟, Корень Бездны 🌑, Цветок феникса 🦅 и др.</li>
                <li><strong>Тир 4 (уровень 4+):</strong> Космическое сердце 💫, Вечное пламя 🔥, Теневой сад 🌿 и др.</li>
                <li><strong>Тир 5 (уровень 5+):</strong> Божественное древо 🌲, Цветок хаоса 🌪️, Семя времени ⏳ и др.</li>
                <li><strong>Тир 6 (уровень 6):</strong> Мировое Древо 🌍, Цветок творения ✨, Омниверсум 🌐 и др.</li>
              </ul>
            </div>
          </div>
        );
      case 'shop':
        return (
          <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
            <div className="font-semibold text-yellow-800 mb-2">🛒 Магазин</div>
            <ul className="text-sm text-yellow-900 list-disc pl-5 space-y-1">
              <li><strong>Семена:</strong> Ассортимент обновляется каждые 4 часа. Цены зависят от редкости (8-8000 $ECO).</li>
              <li><strong>Улучшения:</strong> Ускорение роста ⚡, Двойной доход 💰, Приоритет на бирже 📈 за TON.</li>
              <li><strong>Подписки:</strong> Plus (500 TON/мес) 🥇 даёт 1.5x скорость и приоритет, Premium (1000 TON/мес) 💎 даёт 2.25x скорость и больше бонусов.</li>
            </ul>
          </div>
        );
      case 'synthesis':
        return (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <div className="font-semibold text-indigo-800 mb-2">🧬 Синтез на поле</div>
            <div className="text-sm text-indigo-900 space-y-2">
              <p><strong>Как работает синтез:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>На поле должно быть ровно 4 растения, расположенные так, чтобы в центре осталась пустая клетка</li>
                <li>У вас должен быть уровень 2 или выше</li>
                <li>Центральная пустая клетка начнёт светиться фиолетовым цветом</li>
                <li>На ней появится иконка ДНК 🧬 вместо плюсика</li>
                <li>Нажмите на неё, чтобы открыть меню синтеза</li>
              </ol>
              <p className="mt-3"><strong>Пример расположения (позиции a12, a21, a23, a32):</strong></p>
              <div className="grid grid-cols-3 gap-1 max-w-[150px] mx-auto mt-2">
                <div className="aspect-square bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs"></div>
                <div className="aspect-square bg-green-100 border border-green-300 rounded flex items-center justify-center text-xs">🌱</div>
                <div className="aspect-square bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs"></div>
                <div className="aspect-square bg-green-100 border border-green-300 rounded flex items-center justify-center text-xs">🌱</div>
                <div className="aspect-square bg-purple-200 border-2 border-purple-500 rounded flex items-center justify-center text-xs">🧬</div>
                <div className="aspect-square bg-green-100 border border-green-300 rounded flex items-center justify-center text-xs">🌱</div>
                <div className="aspect-square bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs"></div>
                <div className="aspect-square bg-green-100 border border-green-300 rounded flex items-center justify-center text-xs">🌱</div>
                <div className="aspect-square bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs"></div>
              </div>
              <p className="mt-3 text-xs opacity-75">💡 Синтез позволяет создавать уникальные растения из определённых комбинаций 4 окружающих растений! Доступны только те гибриды, для которых у вас есть нужные растения вокруг.</p>
              <button
                onClick={() => setShowSynthesisPlantsModal(true)}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600"
              >
                🌟 Возможные синтезы
              </button>
            </div>
          </div>
        );
      case 'levels':
        return (
          <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200">
            <div className="font-semibold text-pink-800 mb-2">📈 Система уровней и прогресса</div>
            <ul className="text-sm text-pink-900 list-disc pl-5 space-y-1">
              <li><strong>Уровни:</strong> От 1 до 6. Опыт начисляется за сбор урожая (1-16 XP в зависимости от редкости).</li>
              <li><strong>Пороги:</strong> 500 XP → 2, 2000 → 3, 10000 → 4, 25000 → 5, 100000 → 6.</li>
              <li><strong>Титулы:</strong> Откройте в Профиле. Некоторые требуют определённого уровня или подписки.</li>
            </ul>
          </div>
        );
      case 'rewards':
        return (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <div className="font-semibold text-indigo-800 mb-2">🎁 Система наград</div>
            <ul className="text-sm text-indigo-900 list-disc pl-5 space-y-1">
              <li><strong>Ежедневные награды:</strong> 15-дневная серия посещений с призами ($ECO, ускорители ⚡, семена).</li>
              <li><strong>Колесо фортуны:</strong> Крутите каждый день за дополнительные награды.</li>
              <li><strong>Подписки на каналы:</strong> Подпишитесь на каналы EcoEmpire для эксклюзивных бонусов.</li>
            </ul>
          </div>
        );
      case 'profile':
        return (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
            <div className="font-semibold text-teal-800 mb-2">👤 Профиль и статистика</div>
            <ul className="text-sm text-teal-900 list-disc pl-5 space-y-1">
              <li>Отслеживайте посаженные семена, собранные плоды, созданные гибриды.</li>
              <li>Смотрите общий заработок $ECO и TON, потраченную сумму, время в игре.</li>
              <li>Приглашайте друзей по реферальной ссылке и получайте 5% с их продаж!</li>
            </ul>
          </div>
        );
      case 'exchange':
        return (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
            <div className="font-semibold text-orange-800 mb-2">📈 Биржа</div>
            <div className="text-sm text-orange-900">
              Торгуйте семенами и плодами с другими игроками. Устанавливайте свои цены, ищите выгодные предложения. Приоритет для подписчиков Plus/Premium.
            </div>
          </div>
        );
      case 'tips':
        return (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <div className="font-semibold text-red-800 mb-2">💡 Советы для успеха</div>
            <ul className="text-sm text-red-900 list-disc pl-5 space-y-1">
              <li>Начинайте с быстрых растений (лилия 🌸, гриб 🍄) для быстрого старта.</li>
              <li>Улучшайте поле как можно раньше для увеличения дохода.</li>
              <li>Сохраняйте редкие семена для создания гибридов, которые продаются дороже.</li>
              <li>Используйте ускорители ⚡ для быстрого роста ценных культур.</li>
              <li>Заходите ежедневно за наградами и поддерживайте серию посещений.</li>
              <li>Экспериментируйте с гибридами - комбинируйте разные растения для уникальных результатов!</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">ℹ️ Информация об игре</div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full p-4 rounded-2xl border-2 bg-gradient-to-r ${section.bgColor} ${section.borderColor} transition-all text-left hover:shadow-md active:scale-95`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{section.emoji}</div>
                    <div className={`text-base font-semibold ${section.textColor}`}>{section.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {selectedSection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3"
          onClick={() => setSelectedSection(null)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold">
                {sections.find(s => s.id === selectedSection)?.emoji} {sections.find(s => s.id === selectedSection)?.title}
              </div>
              <button onClick={() => setSelectedSection(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">✕</button>
            </div>

            <div>
              {getSectionContent(selectedSection)}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Модалка возможных синтезов */}
      <AnimatePresence>
        {showSynthesisPlantsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
            onClick={() => setShowSynthesisPlantsModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-bold mb-3 text-center">🧬 Возможные синтезы</div>
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {(() => {
                  const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
                  return SYNTHESIS_PLANTS
                    .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
                    .map(plant => {
                      const recipe = SYNTHESIS_RECIPES.find(r => r.resultId === plant.id);
                      return (
                        <div
                          key={plant.id}
                          className="p-3 rounded-xl border-2 border-gray-200 bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{plant.emoji}</div>
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
                              <div className="text-sm font-bold text-green-600">{plant.sellPrice.toLocaleString()} $ECO</div>
                              <div className="text-xs text-gray-500">Шанс: {plant.successChance}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
              <button
                onClick={() => setShowSynthesisPlantsModal(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


