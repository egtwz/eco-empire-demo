import { pool } from '../../_lib/db.js';
import { verifyTelegramInitData } from '../../_lib/telegram.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawInitData = req.headers['x-telegram-init-data'];
  const verified = verifyTelegramInitData(rawInitData);

  if (!verified?.user?.id) {
    if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user-id']) {
      // Dev mode fallback
    } else {
      res.status(401).json({ error: 'Invalid Telegram init data' });
      return;
    }
  }

  const { type } = req.query || {};
  if (!['daily', 'weekly'].includes(type)) {
    res.status(400).json({ error: 'Invalid quest type' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT quest_id, updated_at, expires_at FROM daily_weekly_quests WHERE quest_type = $1',
      [type]
    );

    if (!rows.length) {
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    res.status(200).json({
      questId: rows[0].quest_id,
      updatedAt: Number(rows[0].updated_at),
      expiresAt: Number(rows[0].expires_at),
    });
  } catch (error) {
    console.error(`[api/quests/${type}] DB error`, error);
    res.status(500).json({ error: 'DB error', details: error?.message ?? String(error) });
  }
}



