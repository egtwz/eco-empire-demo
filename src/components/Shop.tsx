import { useEffect, useRef, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { useShopStock } from '../hooks/useShopStock';
import { SeedId, RARITY_COLORS } from '../data/seeds';
import { BOOSTERS } from '../data/boosters';
import ShopConfirmModal from './ShopConfirmModal';
import SeedInfoModal from './SeedInfoModal';
import SubscriptionModal from './SubscriptionModal';

type Tab = 'seeds' | 'boosters' | 'other';

export default function Shop({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state, buySeed, buyBooster } = game;
  const { stock, timeToRefresh, decreaseStock } = useShopStock();
  const [activeTab, setActiveTab] = useState<Tab>('seeds');
  const [selectedSeed, setSelectedSeed] = useState<{ id: SeedId; name: string; emoji: string; price: number } | null>(null);
  const [seedInfo, setSeedInfo] = useState<any>(null);
  const [subscriptionType, setSubscriptionType] = useState<'plus' | 'premium' | null>(null);

  // Высота фиксированного блока табов, чтобы контент начинался сразу под ним
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [tabsHeight, setTabsHeight] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      if (tabsRef.current) {
        setTabsHeight(tabsRef.current.offsetHeight || 0);
      }
    };
    update();
    window.addEventListener('resize', update);
    // Пересчитываем при смене активной вкладки (высота кнопок может отличаться)
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [activeTab]);

  const handleBuy = (count: number) => {
    if (selectedSeed) {
      for (let i = 0; i < count; i++) {
        buySeed(selectedSeed.id);
        decreaseStock(selectedSeed.id);
      }
    }
  };

  const TabButton = ({ id, label, emoji, color, borderColor }: { id: Tab; label: string; emoji: string; color: string; borderColor: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
        activeTab === id 
          ? `${color} text-white border-${borderColor} shadow-md` 
          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      }`}
    >
      <div className="text-lg mb-1">{emoji}</div>
      <div className="text-xs">{label}</div>
    </button>
  );

  const getRarityColor = (rarity: string) => {
    return RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#9CA3AF';
  };

  // Сортировка по редкости (от обычных к легендарным)
  const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const sortedStock = [...stock].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  // Карточки показываем все, но блокируем покупку по уровню

  return (
    <>
      <div className="max-w-md mx-auto pb-24">
        {/* Вкладки - закреплены при скролле в самом верху */}
        <div ref={tabsRef} className="fixed z-10 bg-transparent w-full max-w-md left-1/2 -translate-x-1/2 pt-0" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}>
          <div className="px-3">
            <div className="flex gap-2 mb-0">
              <TabButton id="seeds" label="Семена" emoji="🌱" color="bg-gradient-to-r from-green-500 to-green-600" borderColor="green-700" />
              <TabButton id="boosters" label="Бустеры" emoji="⚡" color="bg-gradient-to-r from-yellow-500 to-orange-500" borderColor="orange-600" />
              <TabButton id="other" label="Прочее" emoji="💎" color="bg-gradient-to-r from-purple-500 to-pink-500" borderColor="pink-600" />
            </div>
            {activeTab === 'seeds' && (
              <div className="mt-2 text-center text-sm text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-300">
                Следующее обновление через: {Math.floor(timeToRefresh / 60)}:{String(timeToRefresh % 60).padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
        
        {/* Отступ для контента: высота таб-кнопок + небольшой запас */}
        <div style={{ height: `${tabsHeight + 4}px` }} />

        {/* Контент вкладок */}
        <div className="px-3">
          {activeTab === 'seeds' && (
            <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 mt-[30px]">
              {sortedStock.map((s) => {
                const rarityMinLevelMap: any = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
                const minLevel = rarityMinLevelMap[s.rarity as keyof typeof rarityMinLevelMap] || 1;
                const isLockedByLevel = game.state.level < minLevel;
                return (
              <div key={s.id} className={`p-3 rounded-2xl bg-white border border-gray-300 shadow-md relative ${isLockedByLevel ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: getRarityColor(s.rarity) }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Цена: {s.price} $ECO • {s.stock > 0 ? `В наличии: ${s.stock} шт` : 'Нет в наличии'}
                    </div>
                  </div>
                  <button
                    onClick={() => setSeedInfo(s)}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs"
                  >
                    ℹ️
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSeed({ id: s.id, name: s.name, emoji: s.emoji, price: s.price })}
                    disabled={state.balance < s.price || s.stock === 0 || isLockedByLevel}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLockedByLevel ? `🔒 С ${minLevel} уровня` : (s.stock === 0 ? 'Нет в наличии' : 'Купить')}
                  </button>
                </div>
              </div>
              );})}
            </div>
          </div>
          )}

          {activeTab === 'boosters' && (
          <div className="space-y-3 mt-[48px]">
            {Object.values(BOOSTERS).map((booster) => {
              const owned = state.inventory.find((item) => item.id === booster.id)?.count ?? 0;
              const canAfford = state.balance >= booster.price;

              return (
                <div key={booster.id} className="p-3 rounded-2xl bg-white border border-gray-300 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{booster.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{booster.name}</span>
                        <span className="text-sm font-bold text-green-600">{booster.price} $ECO</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{booster.shortDescription}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {booster.usage === 'target'
                          ? 'Применение: нажмите на растущую клетку и выберите бустер'
                          : 'Применение: используйте из инвентаря'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">В инвентаре: {owned} шт.</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => buyBooster(booster.id)}
                        disabled={!canAfford}
                        className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Купить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {activeTab === 'other' && (
            <div className="grid grid-cols-1 gap-2 mt-[48px]">
            {/* Plus подписка */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">🥇</div>
                <div>
                  <div className="text-lg font-bold">EcoEmpire Plus</div>
                  <div className="text-sm opacity-90">Премиум подписка</div>
                </div>
              </div>
              <div className="text-sm mb-3">
                • 1.5x ускорение роста<br/>
                • Двойной доход с шансом 25%<br/>
                • 1.25x цена у скупщика<br/>
                • Приоритет на бирже каждые 2 часа<br/>
                • Золотой цвет никнейма
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSubscriptionType('plus')}
                  className="flex-1 py-2 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition"
                >
                  Подробнее
                </button>
                <button className="flex-1 py-2 rounded-xl bg-white text-yellow-600 font-bold hover:bg-yellow-50 transition">
                  500 TON/мес
                </button>
              </div>
            </div>

            {/* Premium подписка */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">💎</div>
                <div>
                  <div className="text-lg font-bold">EcoEmpire Premium</div>
                  <div className="text-sm opacity-90">Эксклюзивная подписка</div>
                </div>
              </div>
              <div className="text-sm mb-3">
                • 2.25x ускорение роста<br/>
                • Двойной доход с шансом 37.5%<br/>
                • 1.875x цена у скупщика<br/>
                • Приоритет на бирже каждые 1.5 часа<br/>
                • Платиновый цвет никнейма
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSubscriptionType('premium')}
                  className="flex-1 py-2 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition"
                >
                  Подробнее
                </button>
                <button className="flex-1 py-2 rounded-xl bg-white text-purple-600 font-bold hover:bg-purple-50 transition">
                  1000 TON/мес
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {selectedSeed && (
        <ShopConfirmModal
          open={!!selectedSeed}
          seedName={selectedSeed.name}
          seedEmoji={selectedSeed.emoji}
          pricePerUnit={selectedSeed.price}
          balance={state.balance}
          stock={stock.find(s => s.id === selectedSeed.id)?.stock || 0}
          onClose={() => setSelectedSeed(null)}
          onConfirm={handleBuy}
        />
      )}

      {seedInfo && (
        <SeedInfoModal
          open={!!seedInfo}
          seed={seedInfo}
          onClose={() => setSeedInfo(null)}
        />
      )}

      {subscriptionType && (
        <SubscriptionModal
          open={!!subscriptionType}
          type={subscriptionType}
          onClose={() => setSubscriptionType(null)}
        />
      )}
    </>
  );
}