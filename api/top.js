import { pool } from './_lib/db.js';
import { verifyTelegramInitData } from './_lib/telegram.js';

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
      req.telegramUser = { id: Number(req.headers['x-dev-user-id']) };
    } else {
      res.status(401).json({ error: 'Invalid Telegram init data' });
      return;
    }
  } else {
    req.telegramUser = verified.user;
  }

  const { type = 'eco', limit = 100 } = req.query || {};
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 100));

  try {
    if (type === 'eco') {
      console.log('[api/top] Fetching top players by ECO, limit:', limitNum);

      // Получаем пользователей с балансом
      const { rows } = await pool.query(
        `SELECT user_id, save_data
         FROM user_saves
         WHERE save_data IS NOT NULL
           AND save_data ? 'balance'
         LIMIT 500`,
        []
      );

      console.log('[api/top] Fetched', rows.length, 'rows from DB');

      // Фильтруем и сортируем в коде для надежности
      const players = rows
        .map((row) => {
          try {
            const data = row.save_data || {};
            const balanceValue = data.balance;

            // Пробуем разные способы преобразования баланса
            let balance = 0;
            if (typeof balanceValue === 'number') {
              balance = balanceValue;
            } else if (typeof balanceValue === 'string') {
              balance = parseFloat(balanceValue) || 0;
            } else {
              balance = Number(balanceValue) || 0;
            }

            if (!Number.isFinite(balance) || balance <= 0) {
              return null;
            }

            return {
              telegramId: Number(row.user_id),
              username: data.username,
              playerId: data.playerId,
              title: data.title,
              level: data.level || 1,
              balance: balance,
              totalEarned: Number(data.totalEarned || 0),
              seedsPlanted: data.seedsPlanted,
              fruitsHarvested: data.fruitsHarvested,
              hybridsCreated: data.hybridsCreated,
              dailyStreak: data.dailyStreak,
              dailyCycleDay: data.dailyCycleDay,
            };
          } catch (err) {
            console.warn('[api/top] Error processing player row:', err);
            return null;
          }
        })
        .filter(p => p !== null && p.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limitNum);

      console.log('[api/top] Returning', players.length, 'players');
      res.status(200).json({ players });
      return;
    } else {
      // Для других типов пока возвращаем пустой массив
      res.status(200).json({ players: [] });
      return;
    }
  } catch (error) {
    console.error('[api/top] Error:', error);
    res.status(500).json({ error: 'DB error', details: error?.message ?? String(error) });
  }
}



