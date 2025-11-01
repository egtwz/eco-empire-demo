import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import MarketOperationModal from './MarketOperationModal';

interface MarketOrder {
  id: number;
  userId: number;
  itemId: string;
  itemType: 'seed' | 'fruit' | 'currency';
  rarity?: string;
  currency: 'eco' | 'ton';
  price: number;
  quantityTotal: number;
  quantityLeft: number;
  createdAt?: string;
  locked?: {
    itemId: string;
    itemType: 'seed' | 'fruit' | 'currency';
    quantityLocked: number;
    name?: string;
    emoji?: string;
    rarity?: string;
  } | null;
}

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'oldest';

type CreateMode = 'inventory' | 'eco';

const rarityOptions = [
  { value: '', label: 'Все редкости' },
  { value: 'common', label: 'Обычные' },
  { value: 'uncommon', label: 'Необычные' },
  { value: 'rare', label: 'Редкие' },
  { value: 'epic', label: 'Эпические' },
  { value: 'legendary', label: 'Легендарные' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'newest', label: 'Новые' },
  { value: 'oldest', label: 'Старые' },
];

export default function Exchange({ game }: { game: ReturnType<typeof useGameLogic> }) {
  const { state } = game;
  const [currency, setCurrency] = useState<'eco' | 'ton'>('eco');
  const [sort, setSort] = useState<SortOption>('price_asc');
  const [rarity, setRarity] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'seed' | 'fruit'>('all');
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<MarketOrder[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrdersError, setMyOrdersError] = useState<string | null>(null);

  const [createMode, setCreateMode] = useState<CreateMode>('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [createQuantity, setCreateQuantity] = useState(1);
  const [createPrice, setCreatePrice] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [buyQuantity, setBuyQuantity] = useState<Record<number, number>>({});
  const [buyLoadingIds, setBuyLoadingIds] = useState<Set<number>>(new Set());

  const [cancelLoadingIds, setCancelLoadingIds] = useState<Set<number>>(new Set());

  const [modal, setModal] = useState<{ title: string; description: string } | null>(null);

  const prevMyOrdersRef = useRef<MarketOrder[]>([]);

  const itemsInInventory = useMemo(() => {
    return state.inventory
      .filter((item) => (item.type === 'seed' || item.type === 'fruit') && item.count > 0)
      .map((item) => ({ id: item.id, type: item.type as 'seed' | 'fruit', count: item.count, name: item.name, emoji: item.emoji, rarity: (item as any).rarity }));
  }, [state.inventory]);

  const ecoBalance = state.balance ?? 0;

  const availableItems = useMemo(() => {
    if (currency === 'ton' && createMode === 'inventory') {
      return itemsInInventory.filter((item) => item.type === 'seed');
    }
    if (itemTypeFilter === 'seed') return itemsInInventory.filter((item) => item.type === 'seed');
    if (itemTypeFilter === 'fruit') return itemsInInventory.filter((item) => item.type === 'fruit');
    return itemsInInventory;
  }, [itemsInInventory, itemTypeFilter, currency, createMode]);

  const maxQuantityForSelected = useMemo(() => {
    if (createMode === 'eco' && currency === 'ton') {
      return Math.floor(ecoBalance);
    }
    const selected = availableItems.find((item) => item.id === selectedItemId);
    return selected?.count ?? 0;
  }, [availableItems, selectedItemId, createMode, currency, ecoBalance]);

  const commissionInfo = useMemo(() => {
    if (createMode === 'eco') {
      const unitPrice = (createPrice / 1000) || 0;
      const totalPrice = unitPrice * createQuantity;
      const sellerReceives = totalPrice * 0.98;
      const buyerPays = totalPrice * 1.02;
      return { totalPrice, sellerReceives, buyerPays };
    }
    const totalPrice = createPrice * createQuantity;
    const sellerReceives = totalPrice * 0.98;
    const buyerPays = totalPrice * 1.02;
    return { totalPrice, sellerReceives, buyerPays };
  }, [createPrice, createQuantity, createMode]);

  const fetchOrders = useCallback(async (showLoader = true) => {
    if (showLoader) setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params: any = {
        currency,
        sort,
      };
      if (rarity) params.rarity = rarity;
      if (itemTypeFilter !== 'all') params.item_type = itemTypeFilter;
      const data = await game.listMarketOrders(params);
      const list: MarketOrder[] = (data?.orders ?? []).map((order: any) => ({
        id: Number(order.id),
        userId: Number(order.userId ?? order.user_id),
        itemId: order.itemId ?? order.item_id,
        itemType: order.itemType ?? order.item_type,
        rarity: order.rarity ?? undefined,
        currency: order.currency,
        price: Number(order.price),
        quantityTotal: Number(order.quantityTotal ?? order.quantity_total),
        quantityLeft: Number(order.quantityLeft ?? order.quantity_left),
        createdAt: order.createdAt ?? order.created_at,
        locked: order.locked ?? order.locked_items ?? null,
      }));
      setOrders(list);
    } catch (error: any) {
      console.error(error);
      setOrdersError(error?.message || 'Не удалось загрузить заявки');
    } finally {
      if (showLoader) setOrdersLoading(false);
    }
  }, [currency, sort, rarity, itemTypeFilter, game]);

  const fetchMyOrders = useCallback(async (options?: { silent?: boolean; notify?: boolean }) => {
    const silent = options?.silent;
    if (!silent) {
      setMyOrdersLoading(true);
      setMyOrdersError(null);
    }
    try {
      const data = await game.listMyMarketOrders();
      const list: MarketOrder[] = (data?.orders ?? []).map((order: any) => ({
        id: Number(order.id),
        userId: Number(order.userId ?? order.user_id),
        itemId: order.itemId ?? order.item_id,
        itemType: order.itemType ?? order.item_type,
        rarity: order.rarity ?? undefined,
        currency: order.currency,
        price: Number(order.price),
        quantityTotal: Number(order.quantityTotal ?? order.quantity_total),
        quantityLeft: Number(order.quantityLeft ?? order.quantity_left),
        createdAt: order.createdAt ?? order.created_at,
        locked: order.locked ?? order.locked_items ?? null,
      }));

      if (options?.notify && prevMyOrdersRef.current.length > 0) {
        const prev = prevMyOrdersRef.current;
        for (const prevOrder of prev) {
          const next = list.find((o) => o.id === prevOrder.id);
          let soldQty = 0;
          if (!next) {
            soldQty = prevOrder.quantityLeft;
          } else if (next.quantityLeft < prevOrder.quantityLeft) {
            soldQty = prevOrder.quantityLeft - next.quantityLeft;
          }
          if (soldQty > 0) {
            const income = soldQty * prevOrder.price * 0.98;
            setModal({
              title: 'Продажа выполнена',
              description: `Вы продали ${soldQty} × ${formatItemTitle(prevOrder)} за ${income.toFixed(2)} ${prevOrder.currency === 'eco' ? '$ECO' : 'TON'}.`,
            });
          }
        }
      }

      prevMyOrdersRef.current = list;
      setMyOrders(list);
    } catch (error: any) {
      console.error(error);
      if (!silent) {
        setMyOrdersError(error?.message || 'Не удалось получить ваши предложения');
      }
    } finally {
      if (!silent) {
        setMyOrdersLoading(false);
      }
    }
  }, [game]);

  useEffect(() => {
    // Сбрасываем выбор предмета при переключении режима
    if (createMode === 'eco') {
      setSelectedItemId('ECO');
    } else if (availableItems.length > 0) {
      setSelectedItemId(availableItems[0].id);
    } else {
      setSelectedItemId('');
    }
    setCreateQuantity(1);
  }, [createMode, availableItems]);

  const handleRefresh = () => {
    fetchOrders();
    fetchMyOrders({ silent: true });
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleCreateOrder = async () => {
    setCreateError(null);
    if (creating) return;
    const selectedItem = availableItems.find((item) => item.id === selectedItemId);
    if (createMode === 'inventory' && !selectedItem) {
      setCreateError('Выберите предмет для продажи');
      return;
    }
    if (createQuantity <= 0 || createPrice <= 0) {
      setCreateError('Количество и цена должны быть положительными');
      return;
    }
    if (createMode === 'inventory' && createQuantity > maxQuantityForSelected) {
      setCreateError('Недостаточно предметов для продажи');
      return;
    }
    if (createMode === 'eco' && createQuantity > ecoBalance) {
      setCreateError('Недостаточно $ECO для продажи');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        itemId: createMode === 'eco' ? 'ECO' : selectedItemId,
        itemType: createMode === 'eco' ? 'currency' : (selectedItem?.type ?? 'seed'),
        rarity: createMode === 'eco' ? undefined : selectedItem?.rarity,
        price: createMode === 'eco' ? createPrice / 1000 : createPrice,
        quantity: createQuantity,
        currency,
        metadata: createMode === 'eco'
          ? { name: '$ECO', emoji: '💵' }
          : {
              name: selectedItem?.name,
              emoji: selectedItem?.emoji,
            },
      } as Parameters<typeof game.createMarketOrder>[0];
      await game.createMarketOrder(payload);
      const revenueText = createMode === 'eco'
        ? `${commissionInfo.sellerReceives.toFixed(2)} ${currency === 'eco' ? '$ECO' : 'TON'} (за ${createQuantity.toLocaleString()} $ECO)`
        : `${commissionInfo.sellerReceives.toFixed(2)} ${currency === 'eco' ? '$ECO' : 'TON'}`;
      setModal({
        title: 'Ордер создан',
        description: `Ваша заявка успешно размещена. После продажи вы получите ${revenueText}.`,
      });
      setCreateQuantity(1);
      setCreatePrice(1);
      game.reloadFromServer();
      fetchOrders();
      fetchMyOrders({ silent: true, notify: true });
    } catch (error: any) {
      console.error(error);
      setCreateError(error?.message || 'Не удалось создать заявку');
    } finally {
      setCreating(false);
    }
  };

  const handleBuy = async (order: MarketOrder) => {
    const qty = buyQuantity[order.id] ?? 1;
    if (qty <= 0 || qty > order.quantityLeft) return;
    setBuyLoadingIds((prev) => new Set(prev).add(order.id));
    try {
      await game.buyMarketOrder(order.id, qty);
      setModal({
        title: 'Покупка успешна',
        description: `Вы приобрели ${qty} × ${formatItemTitle(order)} за ${computeBuyerTotal(order, qty).toFixed(2)} ${order.currency === 'eco' ? '$ECO' : 'TON'}.`,
      });
      game.reloadFromServer();
      fetchOrders();
      fetchMyOrders({ silent: true, notify: true });
    } catch (error: any) {
      console.error(error);
      setModal({
        title: 'Ошибка покупки',
        description: error?.message || 'Не удалось выполнить сделку.',
      });
    } finally {
      setBuyLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const handleCancel = async (order: MarketOrder) => {
    setCancelLoadingIds((prev) => new Set(prev).add(order.id));
    try {
      await game.cancelMarketOrder(order.id);
      setModal({
        title: 'Заявка отменена',
        description: 'Вы не продали предмет. Он возвращён в ваш инвентарь без удержания комиссии.',
      });
      game.reloadFromServer();
      fetchOrders();
      fetchMyOrders({ silent: true });
    } catch (error: any) {
      console.error(error);
      setModal({ title: 'Ошибка', description: error?.message || 'Не удалось отменить заявку.' });
    } finally {
      setCancelLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const ordersFiltered = useMemo(() => {
    return orders
      .filter((order) => order.quantityLeft > 0 && order.userId !== (game.telegramId ?? 0))
      .filter((order) => {
        if (currency === 'ton' && order.itemType === 'fruit') return false;
        if (itemTypeFilter === 'seed' && order.itemType !== 'seed') return false;
        if (itemTypeFilter === 'fruit' && order.itemType !== 'fruit') return false;
        if (rarity && order.rarity !== rarity) return false;
        return true;
      });
  }, [orders, currency, itemTypeFilter, rarity, game.telegramId]);

  return (
    <div className="max-w-xl mx-auto p-3 pb-24">
      <div className="flex gap-2 mb-4">
        {(['eco', 'ton'] as const).map((tab) => (
        <button
            key={tab}
            onClick={() => setCurrency(tab)}
            className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${
              currency === tab
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-700 shadow-md' 
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <div className="text-lg mb-1">{tab === 'eco' ? '💵' : '💎'}</div>
            <div className="text-xs uppercase tracking-wide">{tab === 'eco' ? '$ECO' : 'TON'}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setMyOrdersOpen((prev) => !prev)}
        className={`w-full mb-4 py-3 rounded-xl font-semibold transition ${
          myOrdersOpen ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        }`}
      >
        {myOrdersOpen ? 'Скрыть мои предложения' : '📋 Мои предложения'}
        </button>
      {myOrdersOpen && (
        <button
          onClick={() => fetchMyOrders()}
          className="w-full mb-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
        >
          🔄 Обновить мои предложения
        </button>
      )}

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Сортировка</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Редкость</label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            {rarityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {currency === 'eco' && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Тип предмета</label>
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value as 'all' | 'seed' | 'fruit')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">Все</option>
              <option value="seed">Семена</option>
              <option value="fruit">Плоды</option>
            </select>
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          🔄 Обновить
        </button>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Доступные предложения</h2>
        <div className="space-y-2">
          {ordersLoading ? (
            <div className="space-y-2">
              <div className="h-20 rounded-2xl border border-gray-200 bg-white/40" />
              <div className="h-20 rounded-2xl border border-gray-200 bg-white/40" />
            </div>
          ) : ordersError ? (
            <div className="text-sm text-red-500">{ordersError}</div>
          ) : ordersFiltered.length === 0 ? (
            <div className="text-sm text-gray-500">
              Нажмите «Обновить», чтобы загрузить актуальные предложения.
            </div>
          ) : (
            ordersFiltered.map((order) => {
              const max = order.quantityLeft;
              const selectedQty = Math.min(buyQuantity[order.id] ?? 1, max);
              const priceLabel = order.itemType === 'currency'
                ? `${(order.price * 1000).toFixed(4)} TON / 1000 $ECO`
                : `${order.price} ${order.currency === 'eco' ? '$ECO' : 'TON'}`;
              return (
                <div key={order.id} className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-lg">{order.locked?.emoji || (order.itemType === 'currency' ? '💵' : '🧬')}</span>
                        <span>{formatItemTitle(order)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Цена: {priceLabel} • Осталось: {order.quantityLeft}/{order.quantityTotal}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>ID заявки: {order.id}</div>
                      {order.createdAt && <div>{new Date(order.createdAt).toLocaleString()}</div>}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <label className="text-xs text-gray-500">
                      Количество: {selectedQty}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={max}
                      value={selectedQty}
                      onChange={(e) => setBuyQuantity((prev) => ({ ...prev, [order.id]: Number(e.target.value) }))}
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Итого: {computeBuyerTotal(order, selectedQty).toFixed(2)} {order.currency === 'eco' ? '$ECO' : 'TON'}</span>
                      <span>Комиссия: 4%</span>
                    </div>
                    <button
                      onClick={() => handleBuy(order)}
                      disabled={buyLoadingIds.has(order.id) || max === 0}
                      className={`w-full py-2 rounded-xl text-sm font-semibold ${
                        buyLoadingIds.has(order.id)
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {buyLoadingIds.has(order.id) ? 'Покупка...' : 'Купить'}
                    </button>
                  </div>
          </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Выставить на продажу</h2>
        <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
          {currency === 'ton' && (
            <div className="flex gap-2">
              <button
                onClick={() => setCreateMode('inventory')}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${
                  createMode === 'inventory' ? 'bg-purple-500 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                Семена
              </button>
              <button
                onClick={() => setCreateMode('eco')}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${
                  createMode === 'eco' ? 'bg-purple-500 text-white border-purple-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                Продать $ECO за TON
              </button>
            </div>
          )}

          {createMode === 'inventory' ? (
        <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Предмет</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  {availableItems.length === 0 && <option value="">Нет предметов</option>}
                  {availableItems.map((item) => (
                    <option key={`${item.type}-${item.id}`} value={item.id}>
                      {item.emoji} {item.name} — {item.count} шт.
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Доступно: {maxQuantityForSelected}</span>
                {maxQuantityForSelected === 0 && <span className="text-red-500">Нет доступных предметов</span>}
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-600">
              <div>Вы продаёте $ECO за TON.</div>
              <div>Доступно: {ecoBalance.toLocaleString()} $ECO</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Количество</label>
              <input
                type="number"
                min={1}
                value={createQuantity}
                onChange={(e) => setCreateQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {createMode === 'eco' ? 'Цена за 1000 $ECO (TON)' : `Цена за единицу (${currency === 'eco' ? '$ECO' : 'TON'})`}
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={createPrice}
                onChange={(e) => setCreatePrice(Math.max(0.01, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {createMode === 'eco'
              ? <>После сделки вы получите <span className="text-green-600 font-semibold">{commissionInfo.sellerReceives.toFixed(2)} TON</span> за выбранный объём в {createQuantity.toLocaleString()} $ECO (учтена комиссия 2%).</>
              : <>После сделки вы получите <span className="text-green-600 font-semibold">{commissionInfo.sellerReceives.toFixed(2)} {currency === 'eco' ? '$ECO' : 'TON'}</span> (учтена комиссия 2%).</>}
          </div>

          {createError && <div className="text-xs text-red-500">{createError}</div>}

          <button
            onClick={handleCreateOrder}
            disabled={creating || (createMode === 'inventory' && (!selectedItemId || maxQuantityForSelected === 0)) || (createMode === 'eco' && ecoBalance <= 0)}
            className={`w-full py-2 rounded-xl text-sm font-semibold ${
              creating ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {creating ? 'Выставляется...' : 'Выставить на продажу'}
          </button>
        </div>
      </section>

      {myOrdersOpen && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Мои предложения</h2>
          <div className="space-y-2">
            {myOrdersLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-2xl border border-gray-200 bg-white/40" />
                <div className="h-16 rounded-2xl border border-gray-200 bg-white/40" />
              </div>
            ) : myOrdersError ? (
              <div className="text-sm text-red-500">{myOrdersError}</div>
            ) : myOrders.length === 0 ? (
              <div className="text-sm text-gray-500">Нажмите «Обновить мои предложения», чтобы загрузить список.</div>
            ) : (
              myOrders.map((order) => (
                <div key={order.id} className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-lg">{order.locked?.emoji || (order.itemType === 'currency' ? '💵' : '🧬')}</span>
                        <span>{formatItemTitle(order)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Цена: {order.itemType === 'currency' ? `${(order.price * 1000).toFixed(4)} TON / 1000 $ECO` : `${order.price} ${order.currency === 'eco' ? '$ECO' : 'TON'}`} • Осталось: {order.quantityLeft}/{order.quantityTotal}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>ID: {order.id}</div>
                      {order.createdAt && <div>{new Date(order.createdAt).toLocaleString()}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={cancelLoadingIds.has(order.id)}
                    className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold ${
                      cancelLoadingIds.has(order.id) ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {cancelLoadingIds.has(order.id) ? 'Отмена...' : 'Забрать с биржи'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
        <div className="text-sm font-semibold text-purple-800 mb-2">ℹ️ Подсказки</div>
        <div className="text-xs text-purple-700 space-y-1">
          <div>• Комиссия 2% удерживается и у продавца, и у покупателя.</div>
          <div>• В разделе "Мои предложения" вы можете отменить ордер и вернуть предметы.</div>
          <div>• Предложения обновляются по кнопке «Обновить» или после совершения сделки.</div>
        </div>
      </section>

      <MarketOperationModal
        open={!!modal}
        title={modal?.title || ''}
        description={modal?.description || ''}
        onClose={() => setModal(null)}
      />
    </div>
  );
}

function computeBuyerTotal(order: MarketOrder, quantity: number) {
  return order.price * quantity * 1.02;
}

function formatItemTitle(order: MarketOrder) {
  if (order.itemType === 'currency') {
    return '$ECO';
  }
  return order.locked?.name || order.itemId;
}