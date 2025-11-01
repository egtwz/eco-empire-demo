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

    const { sellerReceives, buyerPays, commission } = calculateTradeAmounts(unitPrice, tradeQty);

    if (order.currency === 'eco') {
      if ((buyerSave.balance ?? 0) < buyerPays) {
        throw Object.assign(new Error('Недостаточно $ECO для покупки'), { statusCode: 400 });
      }
      buyerSave.balance = roundAmount((buyerSave.balance ?? 0) - buyerPays);
      sellerSave.balance = roundAmount((sellerSave.balance ?? 0) + sellerReceives);
    } else {
      if ((buyerSave.tonBalance ?? 0) < buyerPays) {
        throw Object.assign(new Error('Недостаточно TON для покупки'), { statusCode: 400 });
      }
      buyerSave.tonBalance = roundAmount((buyerSave.tonBalance ?? 0) - buyerPays);
      sellerSave.tonBalance = roundAmount((sellerSave.tonBalance ?? 0) + sellerReceives);
    }

    const lockedArraySeller = ensureMarketLocked(sellerSave);
    adjustMarketLocked(lockedArraySeller, orderId, (entry) => {
      const remaining = Number(entry.quantity || 0) - tradeQty;
      if (remaining <= 0) return null;
      entry.quantity = remaining;
      return entry;
    });
    sellerSave.marketLocked = lockedArraySeller;

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

    sellerSave.inventory = cloneInventory(sellerSave);

    const nowTs = currentTimestamp();
    await client.query('UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1', [order.user_id, sellerSave, nowTs]);
    await client.query('UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1', [verified.user.id, buyerSave, nowTs]);

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

    await client.query('COMMIT');
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
