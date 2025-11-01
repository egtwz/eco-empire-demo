import { pool } from '../../_lib/db.js';
import { verifyTelegramInitData } from '../../_lib/telegram.js';
import { formatOrderRow } from '../../_lib/market.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawInitData = req.headers['x-telegram-init-data'];
  const verified = verifyTelegramInitData(rawInitData);
  if (!verified?.user?.id) {
    res.status(401).json({ error: 'Invalid Telegram init data' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items, created_at, updated_at
       FROM market_orders
       WHERE user_id = $1 AND status = 'open'
       ORDER BY created_at DESC`,
      [verified.user.id]
    );
    res.status(200).json({ orders: rows.map(formatOrderRow) });
  } catch (error) {
    console.error('[api/market/orders/mine] DB error', error);
    res.status(500).json({ error: 'DB error' });
  }
}
