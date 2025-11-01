import { pool } from '../../../_lib/db.js';
import { verifyTelegramInitData, readJsonBody } from '../../../_lib/telegram.js';
import {
  ensurePositiveInteger,
  cloneInventory,
  ensureMarketLocked,
  changeInventoryQuantity,
  parseLockedInfo,
  calculateTradeAmounts,
  fetchUserSaveForUpdate,
  currentTimestamp,
  adjustMarketLocked,
  roundAmount,
} from '../../../_lib/market.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch (error) {
    console.error('[api/market/orders/buy] invalid json', error);
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const rawInitData = req.headers['x-telegram-init-data'] || body.__telegramInitData;
  const verified = verifyTelegramInitData(rawInitData);
  if (!verified?.user?.id) {
    res.status(401).json({ error: 'Invalid Telegram init data' });
    return;
  }

  const orderIdParam = Array.isArray(req.query?.order_id) ? req.query.order_id[0] : req.query?.order_id;
  const orderId = Number(orderIdParam);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: 'Invalid order id' });
    return;
  }

  let quantity;
  try {
    quantity = ensurePositiveInteger(body.quantity, 'quantity');
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query('SELECT * FROM market_orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!orderRows.length) {
      throw Object.assign(new Error('Заявка не найдена'), { statusCode: 404 });
    }
    const order = orderRows[0];
    if (order.status !== 'open' || Number(order.quantity_left) <= 0) {
      throw Object.assign(new Error('Заявка уже закрыта'), { statusCode: 400 });
    }
    if (Number(order.user_id) === Number(verified.user.id)) {
      throw Object.assign(new Error('Нельзя покупать свою заявку'), { statusCode: 400 });
    }

    const quantityLeft = Number(order.quantity_left);
    const tradeQty = Math.min(quantity, quantityLeft);
    const unitPrice = Number(order.price);
    const lockedInfo = parseLockedInfo(order.locked_items);
    if (!lockedInfo) {
      throw Object.assign(new Error('Заявка повреждена'), { statusCode: 400 });
    }

    const sellerSave = await fetchUserSaveForUpdate(client, order.user_id);
    const buyerSave = await fetchUserSaveForUpdate(client, verified.user.id);

    // КРИТИЧНО: Создаем КОПИИ объектов, чтобы гарантировать сохранение изменений
    // PostgreSQL может не видеть изменения, если мы мутируем объект напрямую
    const sellerSaveBefore = {
      balance: sellerSave.balance ?? 0,
      tonBalance: sellerSave.tonBalance ?? 0,
    };
    
    const { sellerReceives, buyerPays, commission } = calculateTradeAmounts(unitPrice, tradeQty);

    // ВАЖНО: Сначала проверяем баланс покупателя, затем изменяем балансы обоих
    if (order.currency === 'eco') {
      if ((buyerSave.balance ?? 0) < buyerPays) {
        throw Object.assign(new Error('Недостаточно $ECO для покупки'), { statusCode: 400 });
      }
      // Списание у покупателя
      buyerSave.balance = roundAmount((buyerSave.balance ?? 0) - buyerPays);
      // Зачисление продавцу - КРИТИЧНО: создаем новый объект с обновленным балансом
      const newSellerBalance = roundAmount((sellerSave.balance ?? 0) + sellerReceives);
      sellerSave.balance = newSellerBalance;
      
      // Логирование для отладки
      console.log(`[api/market/orders/buy] Seller balance update: ${sellerSaveBefore.balance} + ${sellerReceives} = ${newSellerBalance}`);
    } else {
      if ((buyerSave.tonBalance ?? 0) < buyerPays) {
        throw Object.assign(new Error('Недостаточно TON для покупки'), { statusCode: 400 });
      }
      // Списание у покупателя
      buyerSave.tonBalance = roundAmount((buyerSave.tonBalance ?? 0) - buyerPays);
      // Зачисление продавцу - КРИТИЧНО: создаем новый объект с обновленным балансом
      const newSellerTonBalance = roundAmount((sellerSave.tonBalance ?? 0) + sellerReceives);
      sellerSave.tonBalance = newSellerTonBalance;
      
      // Логирование для отладки
      console.log(`[api/market/orders/buy] Seller TON balance update: ${sellerSaveBefore.tonBalance} + ${sellerReceives} = ${newSellerTonBalance}`);
    }

    // Обновление marketLocked у продавца (разблокировка проданных предметов)
    const lockedArraySeller = ensureMarketLocked(sellerSave);
    adjustMarketLocked(lockedArraySeller, orderId, (entry) => {
      const remaining = Number(entry.quantity || 0) - tradeQty;
      if (remaining <= 0) return null;
      entry.quantity = remaining;
      return entry;
    });
    sellerSave.marketLocked = lockedArraySeller;

    // Передача предмета покупателю
    if (order.item_type === 'currency') {
      buyerSave.balance = roundAmount((buyerSave.balance ?? 0) + tradeQty);
    } else {
      const buyerInventory = cloneInventory(buyerSave);
      changeInventoryQuantity(buyerInventory, {
        itemId: order.item_id,
        itemType: order.item_type,
        delta: tradeQty,
        name: lockedInfo.name,
        emoji: lockedInfo.emoji,
        rarity: lockedInfo.rarity,
      });
      buyerSave.inventory = buyerInventory;
    }

    // КРИТИЧНО: Создаем НОВЫЙ объект для сохранения, чтобы PostgreSQL точно увидел изменения
    // Это гарантирует, что деньги появятся в БД моментально
    const nowTs = currentTimestamp();
    
    // Создаем глубокую копию sellerSave для гарантии сохранения всех изменений
    const sellerSaveToSave = JSON.parse(JSON.stringify(sellerSave));
    
    // Проверяем, что баланс действительно изменился перед сохранением
    const sellerBalanceAfter = order.currency === 'eco' ? sellerSaveToSave.balance : sellerSaveToSave.tonBalance;
    const sellerBalanceBefore = order.currency === 'eco' ? sellerSaveBefore.balance : sellerSaveBefore.tonBalance;
    
    console.log(`[api/market/orders/buy] Saving seller data: userId=${order.user_id}, balance before=${sellerBalanceBefore}, balance after=${sellerBalanceAfter}, currency=${order.currency}`);
    
    // Первым делом сохраняем sellerSave с обновленным балансом
    // Используем JSON.stringify/parse чтобы гарантировать новую ссылку на объект
    const result = await client.query(
      'UPDATE user_saves SET save_data = $2::jsonb, updated_at = $3 WHERE user_id = $1 RETURNING save_data',
      [order.user_id, JSON.stringify(sellerSaveToSave), nowTs]
    );
    
    // Проверяем, что данные действительно сохранились
    if (result.rows && result.rows[0] && result.rows[0].save_data) {
      const savedBalance = order.currency === 'eco' 
        ? (result.rows[0].save_data.balance ?? 0) 
        : (result.rows[0].save_data.tonBalance ?? 0);
      console.log(`[api/market/orders/buy] Seller data saved successfully: balance in DB=${savedBalance}`);
      if (Math.abs(savedBalance - sellerBalanceAfter) > 0.001) {
        console.error(`[api/market/orders/buy] WARNING: Balance mismatch! Expected=${sellerBalanceAfter}, Got=${savedBalance}`);
      }
    }
    
    // Затем сохраняем buyerSave с обновленным балансом и инвентарем
    // Также создаем копию для гарантии сохранения
    const buyerSaveToSave = JSON.parse(JSON.stringify(buyerSave));
    await client.query(
      'UPDATE user_saves SET save_data = $2::jsonb, updated_at = $3 WHERE user_id = $1',
      [verified.user.id, JSON.stringify(buyerSaveToSave), nowTs]
    );

    // Обновляем заявку и историю сделок
    const remaining = quantityLeft - tradeQty;
    if (lockedInfo) lockedInfo.quantityLocked = remaining;
    const newStatus = remaining === 0 ? 'closed' : 'open';
    await client.query(
      `UPDATE market_orders
       SET quantity_left = $2,
           status = $3,
           locked_items = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [orderId, remaining, newStatus, lockedInfo]
    );

    await client.query(
      `INSERT INTO market_trades (order_id, buyer_id, quantity, price, currency, commission)
       VALUES ($1,$2,$3,$4,$5,$6)` ,
      [orderId, verified.user.id, tradeQty, unitPrice, order.currency, commission]
    );

    // КОММИТ транзакции - все изменения теперь видны в БД
    // После этого продавец может загрузить свои данные и увидеть деньги
    await client.query('COMMIT');
    
    // Логирование для отладки
    console.log(`[api/market/orders/buy] Trade completed: orderId=${orderId}, sellerId=${order.user_id}, buyerId=${verified.user.id}, sellerReceives=${sellerReceives}, buyerPays=${buyerPays}`);
    res.status(200).json({
      ok: true,
      orderId,
      quantityPurchased: tradeQty,
      price: unitPrice,
      buyerPays,
      sellerReceives,
      commission,
      quantityLeft: remaining,
      status: newStatus,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[api/market/orders/buy] error', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
  } finally {
    client.release();
  }
}
