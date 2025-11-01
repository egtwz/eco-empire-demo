import { pool } from '../../../_lib/db.js';
import { verifyTelegramInitData, readJsonBody } from '../../../_lib/telegram.js';
import {
  ensureMarketLocked,
  cloneInventory,
  changeInventoryQuantity,
  parseLockedInfo,
  fetchUserSaveForUpdate,
  currentTimestamp,
  adjustMarketLocked,
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
    console.error('[api/market/orders/cancel] invalid json', error);
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM market_orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!rows.length) {
      throw Object.assign(new Error('Заявка не найдена'), { statusCode: 404 });
    }
    const order = rows[0];
    if (Number(order.user_id) !== Number(verified.user.id)) {
      throw Object.assign(new Error('Нельзя отменить чужую заявку'), { statusCode: 403 });
    }
    if (order.status !== 'open') {
      throw Object.assign(new Error('Заявка уже закрыта'), { statusCode: 400 });
    }

    const lockedInfo = parseLockedInfo(order.locked_items);
    const quantityLeft = Number(order.quantity_left);

    const saveData = await fetchUserSaveForUpdate(client, order.user_id);
    if (quantityLeft > 0 && lockedInfo) {
      if (order.item_type === 'currency') {
        saveData.balance = Number(saveData.balance || 0) + quantityLeft;
      } else {
        const inventory = cloneInventory(saveData);
        changeInventoryQuantity(inventory, {
          itemId: lockedInfo.itemId,
          itemType: lockedInfo.itemType,
          delta: quantityLeft,
          name: lockedInfo.name,
          emoji: lockedInfo.emoji,
          rarity: lockedInfo.rarity,
        });
        saveData.inventory = inventory;
      }
    }

    const lockedArray = ensureMarketLocked(saveData);
    adjustMarketLocked(lockedArray, orderId, () => null);
    saveData.marketLocked = lockedArray;

    await client.query('UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1', [order.user_id, saveData, currentTimestamp()]);
    await client.query(
      `UPDATE market_orders
       SET status = 'cancelled', quantity_left = 0, locked_items = $2, updated_at = NOW()
       WHERE id = $1`,
      [orderId, lockedInfo ? { ...lockedInfo, quantityLocked: 0 } : lockedInfo]
    );

    await client.query('COMMIT');
    res.status(200).json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[api/market/orders/cancel] error', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
  } finally {
    client.release();
  }
}
