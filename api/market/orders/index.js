import { pool } from '../../_lib/db.js';
import { verifyTelegramInitData, readJsonBody } from '../../_lib/telegram.js';
import {
  ensurePositiveInteger,
  ensurePositiveNumber,
  cloneInventory,
  ensureMarketLocked,
  changeInventoryQuantity,
  buildLockedInfo,
  formatOrderRow,
  fetchUserSaveForUpdate,
  currentTimestamp,
  roundAmount,
} from '../../_lib/market.js';

const ORDER_LIMIT = 100;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  let body = {};
  if (req.method !== 'GET') {
    try {
      body = await readJsonBody(req);
    } catch (error) {
      console.error('[api/market/orders] invalid json', error);
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const rawInitData = req.headers['x-telegram-init-data'] || body.__telegramInitData;
  const verified = verifyTelegramInitData(rawInitData);
  if (!verified?.user?.id) {
    res.status(401).json({ error: 'Invalid Telegram init data' });
    return;
  }

  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handlePost(req, res, verified.user.id, body);
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}

async function handleGet(req, res) {
  const { currency, rarity, item_id: itemId, item_type: itemType, sort = 'price_asc' } = req.query || {};

  if (currency !== 'eco' && currency !== 'ton') {
    res.status(400).json({ error: 'Invalid currency' });
    return;
  }

  const params = [currency];
  const filters = [`status = 'open'`, 'currency = $1'];

  if (itemType && ['seed', 'fruit', 'currency'].includes(itemType)) {
    params.push(itemType);
    filters.push(`item_type = $${params.length}`);
  }

  if (itemId) {
    params.push(itemId);
    filters.push(`item_id = $${params.length}`);
  }

  if (rarity) {
    params.push(rarity);
    filters.push(`rarity = $${params.length}`);
  }

  let orderClause = 'ORDER BY price ASC';
  if (sort === 'price_desc') orderClause = 'ORDER BY price DESC';
  if (sort === 'newest') orderClause = 'ORDER BY created_at DESC';
  if (sort === 'oldest') orderClause = 'ORDER BY created_at ASC';

  const sql = `
    SELECT id, user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items, created_at, updated_at
    FROM market_orders
    WHERE ${filters.join(' AND ')}
    ${orderClause}
    LIMIT ${ORDER_LIMIT}
  `;

  try {
    const { rows } = await pool.query(sql, params);
    res.status(200).json({ orders: rows.map(formatOrderRow) });
  } catch (error) {
    console.error('[api/market/orders] DB error', error);
    res.status(500).json({ error: 'DB error' });
  }
}

async function handlePost(req, res, userId, body) {
  const { itemId, itemType, rarity, price, quantity, currency, metadata } = body || {};

  if (!itemId || typeof itemId !== 'string') {
    res.status(400).json({ error: 'itemId is required' });
    return;
  }
  if (!['seed', 'fruit', 'currency'].includes(itemType)) {
    res.status(400).json({ error: 'Invalid itemType' });
    return;
  }
  if (!['eco', 'ton'].includes(currency)) {
    res.status(400).json({ error: 'Invalid currency' });
    return;
  }
  if (itemType === 'currency' && itemId !== 'ECO') {
    res.status(400).json({ error: 'Unsupported currency item' });
    return;
  }

  let qty;
  let unitPrice;
  try {
    qty = ensurePositiveInteger(quantity, 'quantity');
    unitPrice = ensurePositiveNumber(price, 'price');
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
    return;
  }

  if (itemType === 'currency') {
    unitPrice = roundAmount(unitPrice);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saveData = await fetchUserSaveForUpdate(client, userId);
    const inventory = cloneInventory(saveData);

    if (itemType === 'currency') {
      const currentEco = Number(saveData.balance || 0);
      if (currentEco < qty) {
        throw Object.assign(new Error('Недостаточно $ECO для выставления ордера'), { statusCode: 400 });
      }
      saveData.balance = roundAmount(currentEco - qty);
    } else {
      changeInventoryQuantity(inventory, {
        itemId,
        itemType,
        delta: -qty,
        name: metadata?.name,
        emoji: metadata?.emoji,
        rarity,
      });
      saveData.inventory = inventory;
    }

    const lockedInfo = buildLockedInfo({
      itemId,
      itemType,
      name: metadata?.name,
      emoji: metadata?.emoji,
      rarity,
      quantity: qty,
    });

    const insertResult = await client.query(
      `INSERT INTO market_orders
        (user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'open',$8)
       RETURNING id, user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items, created_at, updated_at`,
      [userId, itemId, itemType, rarity || null, currency, unitPrice, qty, lockedInfo]
    );

    const orderRow = insertResult.rows[0];
    const order = formatOrderRow(orderRow);

    const lockedArray = ensureMarketLocked(saveData);
    lockedArray.push({
      orderId: order.id,
      itemId,
      itemType,
      quantity: qty,
      name: metadata?.name || lockedInfo.name,
      emoji: metadata?.emoji || lockedInfo.emoji,
      rarity,
      currency,
    });
    saveData.marketLocked = lockedArray;

    await client.query(
      'UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1',
      [userId, saveData, currentTimestamp()]
    );

    await client.query('COMMIT');

    const sellerReceives = roundAmount(unitPrice * qty * 0.98);
    res.status(200).json({ order, sellerReceives });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[api/market/orders] create error', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
  } finally {
    client.release();
  }
}
