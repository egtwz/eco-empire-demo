if (process.env.NODE_ENV !== 'production') {
  // Load environment variables from .env when running locally
  require('dotenv').config();
  // Supabase uses a self-signed certificate for pooled connections; allow it locally
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const crypto = require('crypto');
const {
  ensurePositiveInteger,
  ensurePositiveNumber,
  cloneInventory,
  ensureMarketLocked,
  changeInventoryQuantity,
  buildLockedInfo,
  parseLockedInfo,
  formatOrderRow,
  calculateTradeAmounts,
  fetchUserSaveForUpdate,
  currentTimestamp,
  adjustMarketLocked,
  roundAmount,
} = require('./marketCommon.cjs');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

if (!process.env.BOT_TOKEN) {
  console.warn('[server] BOT_TOKEN is not set – Telegram auth will reject real clients');
}

function parseUserId(req, res, next) {
  const { user_id } = req.params;
  if (!user_id || !/^[0-9]+$/.test(user_id)) {
    return res.status(400).json({ error: 'Invalid user_id' });
  }
  next();
}

function verifyTelegramInitData(rawInitData) {
  if (!rawInitData) return null;
  const urlParams = new URLSearchParams(rawInitData);
  const data = {};
  urlParams.forEach((value, key) => {
    data[key] = value;
  });

  const { hash } = data;
  if (!hash) return null;
  delete data.hash;

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.warn('BOT_TOKEN env not set – Telegram verification skipped');
    return null;
  }

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const checkHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (checkHash !== hash) return null;

  let user = null;
  if (data.user) {
    try {
      user = JSON.parse(data.user);
    } catch (error) {
      console.error('Failed to parse telegram user JSON', error);
      return null;
    }
  }

  return {
    user,
    authDate: data.auth_date ? Number(data.auth_date) : undefined,
    queryId: data.query_id,
  };
}

function ensureTelegramAuth(req, res, next) {
  const rawInitData = req.get('x-telegram-init-data') || req.body?.__telegramInitData;

  if (!rawInitData) {
    if (process.env.NODE_ENV !== 'production' && req.get('x-dev-user-id')) {
      req.telegramUser = { id: Number(req.get('x-dev-user-id')) };
      return next();
    }
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  const verified = verifyTelegramInitData(rawInitData);
  if (!verified || !verified.user?.id) {
    return res.status(401).json({ error: 'Invalid Telegram init data' });
  }

  req.telegramUser = verified.user;

  if (req.params?.user_id && String(req.telegramUser.id) !== req.params.user_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.body?.user_id && String(req.body.user_id) !== String(req.telegramUser.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!req.body?.user_id && req.telegramUser?.id && req.method !== 'GET') {
    req.body = req.body || {};
    req.body.user_id = req.telegramUser.id;
  }

  next();
}

const orderCommissionSell = 0.02;
const orderCommissionBuy = 0.02;

function applyDefaultReferralStats(saveData) {
  if (!saveData.referralStats) {
    saveData.referralStats = { totalIncome: 0, salesIncome: 0, tonIncome: 0, count: saveData.referralStats?.count || 0 };
  } else {
    saveData.referralStats.totalIncome = Number(saveData.referralStats.totalIncome || 0);
    saveData.referralStats.salesIncome = Number(saveData.referralStats.salesIncome || 0);
    saveData.referralStats.tonIncome = Number(saveData.referralStats.tonIncome || 0);
    saveData.referralStats.count = Number(saveData.referralStats.count || 0);
  }
}

// Saves
app.get('/api/save/:user_id', ensureTelegramAuth, parseUserId, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select save_data, updated_at from user_saves where user_id = $1',
      [req.params.user_id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error('load save error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/save/:user_id', ensureTelegramAuth, parseUserId, async (req, res) => {
  const { save_data, updated_at } = req.body || {};
  if (!save_data || !updated_at) return res.status(400).json({ error: 'Missing payload' });
  try {
    await pool.query(
      `insert into user_saves (user_id, save_data, updated_at)
       values ($1, $2, $3)
       on conflict (user_id) do update
       set save_data = excluded.save_data,
           updated_at = excluded.updated_at`,
      [req.params.user_id, save_data, updated_at]
    );
    return res.json({ ok: true, updated_at });
  } catch (e) {
    console.error('save insert error', e);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/save/:user_id', ensureTelegramAuth, parseUserId, async (req, res) => {
  const { save_data, updated_at, last_client_known } = req.body || {};
  if (!save_data || !updated_at) return res.status(400).json({ error: 'Missing payload' });
  try {
    // КРИТИЧНО: Проверяем текущее состояние в БД
    const existing = await pool.query(
      'select save_data, updated_at from user_saves where user_id = $1',
      [req.params.user_id]
    );
    
    // Если данные на сервере новее, чем last_client_known - это конфликт
    // Это может быть сохранение после покупки на рынке, которое клиент еще не видел
    if (existing.rowCount && existing.rows[0].updated_at > (last_client_known || 0)) {
      console.log(`[app.cjs PUT save] Conflict detected for user ${req.params.user_id}: server updated_at=${existing.rows[0].updated_at}, client known=${last_client_known || 0}`);
      return res.status(409).json({ 
        error: 'Conflict', 
        updated_at: existing.rows[0].updated_at,
        save_data: existing.rows[0].save_data // Возвращаем актуальные данные с сервера
      });
    }

    // Если updated_at клиента НОВЕЕ или РАВЕН серверному - сохраняем
    // Но проверяем, что не перезаписываем данные рынка (если updated_at клиента старше серверного)
    if (existing.rowCount && existing.rows[0].updated_at && updated_at < existing.rows[0].updated_at) {
      console.warn(`[app.cjs PUT save] WARNING: Client trying to save older data for user ${req.params.user_id}: client=${updated_at}, server=${existing.rows[0].updated_at}`);
      return res.status(409).json({ 
        error: 'Conflict', 
        updated_at: existing.rows[0].updated_at,
        save_data: existing.rows[0].save_data
      });
    }

    await pool.query(
      `insert into user_saves (user_id, save_data, updated_at)
       values ($1, $2, $3)
       on conflict (user_id) do update
       set save_data = excluded.save_data,
           updated_at = excluded.updated_at`,
      [req.params.user_id, save_data, updated_at]
    );
    return res.json({ ok: true, updated_at });
  } catch (e) {
    console.error('save update error', e);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/referrals/:user_id', ensureTelegramAuth, parseUserId, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select user_id, save_data
         from user_saves
        where (save_data->>'referrerId')::bigint = $1`,
      [req.params.user_id]
    );
    const list = rows.map((row) => {
      const data = row.save_data || {};
      return {
        telegramId: Number(row.user_id),
        username: data.username,
        playerId: data.playerId,
        title: data.title,
        level: data.level,
        balance: data.balance,
        totalEarned: data.totalEarned,
        seedsPlanted: data.seedsPlanted,
        fruitsHarvested: data.fruitsHarvested,
        hybridsCreated: data.hybridsCreated,
        dailyStreak: data.dailyStreak,
        dailyCycleDay: data.dailyCycleDay,
      };
    });
    return res.json({ referrals: list });
  } catch (error) {
    console.error('referrals list error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/top', ensureTelegramAuth, async (req, res) => {
  console.log('[TOP] Request received:', req.method, req.path, req.query);
  const { type = 'eco', limit = 100 } = req.query;
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 100));
  
  try {
    if (type === 'eco') {
      console.log('[TOP] Fetching top players by ECO, limit:', limitNum);
      // Сортировка по балансу $ECO (balance)
      // Ограничиваем количество строк в SQL для эффективности
      const { rows } = await pool.query(
        `SELECT user_id, save_data
         FROM user_saves
         WHERE save_data IS NOT NULL
           AND save_data ? 'balance'
         LIMIT 500`,
        []
      );
      console.log('[TOP] Fetched', rows.length, 'rows from DB');
      
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
            console.warn('Error processing player row:', err);
            return null;
          }
        })
        .filter(p => p !== null && p.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limitNum);
      
      console.log('[TOP] Returning', players.length, 'players');
      return res.json({ players });
    } else {
      // Для других типов пока возвращаем пустой массив
      return res.json({ players: [] });
    }
  } catch (error) {
    console.error('top players list error', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ error: 'DB error', details: error.message });
  }
});

// Получение текущего ежедневного/еженедельного квеста
app.get('/api/quests/:type', ensureTelegramAuth, async (req, res) => {
  const { type } = req.params;
  if (!['daily', 'weekly'].includes(type)) {
    return res.status(400).json({ error: 'Invalid quest type' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT quest_id, updated_at, expires_at FROM daily_weekly_quests WHERE quest_type = $1',
      [type]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    return res.json({
      questId: rows[0].quest_id,
      updatedAt: Number(rows[0].updated_at),
      expiresAt: Number(rows[0].expires_at),
    });
  } catch (error) {
    console.error(`[api/quests/${type}] error`, error);
    return res.status(500).json({ error: 'DB error', details: error.message });
  }
});

// Обновление ежедневного/еженедельного квеста (для cron или ручного вызова)
app.post('/api/quests/:type/update', async (req, res) => {
  const { type } = req.params;
  if (!['daily', 'weekly'].includes(type)) {
    return res.status(400).json({ error: 'Invalid quest type' });
  }

  // Список возможных квестов (нужно будет импортировать или определить здесь)
  // Для упрощения, используем случайный выбор из предопределенных ID
  const dailyQuestIds = [
    'daily_001', 'daily_002', 'daily_003', 'daily_004', 'daily_005', 'daily_006', 'daily_007', 'daily_008',
    'daily_009', 'daily_010', 'daily_011', 'daily_012', 'daily_013', 'daily_014', 'daily_015', 'daily_016',
    'daily_017', 'daily_018', 'daily_019', 'daily_020', 'daily_021', 'daily_022', 'daily_023', 'daily_024',
    'daily_025', 'daily_026', 'daily_027', 'daily_028', 'daily_029', 'daily_030', 'daily_031', 'daily_032',
    'daily_033', 'daily_034', 'daily_035', 'daily_036', 'daily_037', 'daily_038', 'daily_039', 'daily_040',
    'daily_041', 'daily_042', 'daily_043', 'daily_044', 'daily_045', 'daily_046', 'daily_047', 'daily_048',
    'daily_049', 'daily_050', 'daily_051', 'daily_052'
  ];

  const weeklyQuestIds = [
    'weekly_001', 'weekly_002', 'weekly_003', 'weekly_004', 'weekly_005', 'weekly_006', 'weekly_007',
    'weekly_008', 'weekly_009', 'weekly_010', 'weekly_011', 'weekly_012', 'weekly_013', 'weekly_014',
    'weekly_015', 'weekly_016', 'weekly_017', 'weekly_018', 'weekly_019', 'weekly_020', 'weekly_021',
    'weekly_022', 'weekly_023', 'weekly_024', 'weekly_025', 'weekly_026', 'weekly_027', 'weekly_028',
    'weekly_029', 'weekly_030', 'weekly_031', 'weekly_032', 'weekly_033', 'weekly_034', 'weekly_035',
    'weekly_036', 'weekly_037', 'weekly_038'
  ];

  const questIds = type === 'daily' ? dailyQuestIds : weeklyQuestIds;
  const randomQuestId = questIds[Math.floor(Math.random() * questIds.length)];

  const now = Date.now();
  let expiresAt = now;

  if (type === 'daily') {
    // Истекает через 24 часа (или в следующую полночь МСК)
    const mskOffset = 3 * 60 * 60 * 1000; // МСК = UTC+3
    const nowUtc = Date.now();
    const nowMsk = new Date(nowUtc + mskOffset);
    const nextMidnightMsk = new Date(nowMsk);
    nextMidnightMsk.setHours(24, 0, 0, 0); // Следующая полночь МСК
    expiresAt = nextMidnightMsk.getTime() - mskOffset; // Конвертируем обратно в UTC timestamp
  } else {
    // Истекает в следующий понедельник 00:00 МСК
    const mskOffset = 3 * 60 * 60 * 1000;
    const nowUtc = Date.now();
    const nowMsk = new Date(nowUtc + mskOffset);
    const daysUntilMonday = (8 - nowMsk.getDay()) % 7 || 7;
    const nextMonday = new Date(nowMsk);
    nextMonday.setDate(nowMsk.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    expiresAt = nextMonday.getTime() - mskOffset;
  }

  try {
    await pool.query(
      `INSERT INTO daily_weekly_quests (quest_type, quest_id, updated_at, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (quest_type) DO UPDATE
       SET quest_id = excluded.quest_id,
           updated_at = excluded.updated_at,
           expires_at = excluded.expires_at`,
      [type, randomQuestId, now, expiresAt]
    );

    return res.json({
      ok: true,
      questId: randomQuestId,
      updatedAt: now,
      expiresAt: expiresAt,
    });
  } catch (error) {
    console.error(`[api/quests/${type}/update] error`, error);
    return res.status(500).json({ error: 'DB error', details: error.message });
  }
});

app.post('/api/referrals/reward', ensureTelegramAuth, async (req, res) => {
  const userId = String(req.telegramUser.id);
  const reason = req.body?.reason;
  const rawAmount = Number(req.body?.amount);
  if (!reason || !['sale', 'ton'].includes(reason) || !Number.isFinite(rawAmount) || rawAmount <= 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const amount = Math.floor(rawAmount);

  const client = await pool.connect();
  try {
    const { rows } = await client.query('select save_data from user_saves where user_id = $1', [userId]);
    if (!rows.length) {
      return res.json({ ok: true });
    }
    const referrerId = Number(rows[0].save_data?.referrerId);
    if (!referrerId || referrerId === Number(userId)) {
      return res.json({ ok: true });
    }

    await client.query('BEGIN');
    const refRows = await client.query('select save_data from user_saves where user_id = $1 for update', [referrerId]);
    if (!refRows.length) {
      await client.query('ROLLBACK');
      return res.json({ ok: true });
    }
    const refData = refRows[0].save_data || {};
    const currentBalance = Number(refData.balance) || 0;
    const currentEarned = Number(refData.totalEarned) || 0;
    refData.balance = currentBalance + amount;
    refData.totalEarned = currentEarned + amount;

    const stats = {
      totalIncome: Number(refData.referralStats?.totalIncome) || 0,
      salesIncome: Number(refData.referralStats?.salesIncome) || 0,
      tonIncome: Number(refData.referralStats?.tonIncome) || 0,
      count: Number(refData.referralStats?.count) || 0,
    };
    stats.totalIncome += amount;
    if (reason === 'sale') {
      stats.salesIncome += amount;
    } else if (reason === 'ton') {
      stats.tonIncome += amount;
    }
    refData.referralStats = stats;

    await client.query(
      `update user_saves set save_data = $2, updated_at = $3 where user_id = $1`,
      [referrerId, refData, Date.now()]
    );
    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('referral reward error', error);
    return res.status(500).json({ error: 'DB error' });
  } finally {
    client.release();
  }
});

// Stats
app.post('/api/stats/update', ensureTelegramAuth, async (req, res) => {
  const { user_id, inc_session, time_spent = 0, achievements = [], custom_stats = {} } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const now = Date.now();
  try {
    await pool.query(
      `insert into user_stats (user_id, first_seen, last_seen, session_count, total_time_spent, achievements, custom_stats)
       values ($1, $2, $2, $3, $4, $5, $6)
       on conflict (user_id) do update set
         last_seen = excluded.last_seen,
         session_count = user_stats.session_count + excluded.session_count,
         total_time_spent = user_stats.total_time_spent + excluded.total_time_spent,
         achievements = excluded.achievements,
         custom_stats = excluded.custom_stats`,
      [
        String(user_id),
        now,
        inc_session ? 1 : 0,
        time_spent,
        JSON.stringify(achievements ?? []),
        JSON.stringify(custom_stats ?? {})
      ]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('stats update error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats/summary', ensureTelegramAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select
         count(*)::int as users,
         coalesce(sum(session_count), 0)::int as sessions,
         coalesce(sum(total_time_spent), 0)::bigint as total_time
       from user_stats`
    );
    return res.json(rows[0]);
  } catch (error) {
    console.error('stats summary error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats/users/count', ensureTelegramAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('select count(*)::int as users from user_stats');
    return res.json(rows[0]);
  } catch (error) {
    console.error('stats count error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/market/orders', ensureTelegramAuth, async (req, res) => {
  const { currency, rarity, item_id: itemId, sort = 'price_asc', item_type: itemType } = req.query;
  if (currency !== 'eco' && currency !== 'ton') {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  const params = [currency];
  const filters = ['status = \"open\"', 'currency = $1'];
  let paramIndex = params.length;

  if (itemType && ['seed', 'fruit'].includes(itemType)) {
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
    LIMIT 100
  `;

  try {
    const { rows } = await pool.query(sql, params);
    return res.json({ orders: rows.map(formatOrderRow) });
  } catch (error) {
    console.error('market orders list error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/market/orders/mine', ensureTelegramAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items, created_at, updated_at
       FROM market_orders
       WHERE user_id = $1 AND status = 'open'
       ORDER BY created_at DESC`,
      [req.telegramUser.id]
    );
    return res.json({ orders: rows.map(formatOrderRow) });
  } catch (error) {
    console.error('market orders mine error', error);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/market/orders', ensureTelegramAuth, async (req, res) => {
  const { itemId, itemType, rarity, price, quantity, currency, metadata } = req.body || {};
  try {
    if (!itemId || typeof itemId !== 'string') {
      return res.status(400).json({ error: 'itemId is required' });
    }
    if (!['seed', 'fruit', 'currency'].includes(itemType)) {
      return res.status(400).json({ error: 'Invalid itemType' });
    }
    if (!['eco', 'ton'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    if (itemType === 'currency' && itemId !== 'ECO') {
      return res.status(400).json({ error: 'Unsupported currency item' });
    }
    const qty = ensurePositiveInteger(quantity, 'quantity');
    const unitPrice = ensurePositiveNumber(price, 'price');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const saveData = await fetchUserSaveForUpdate(client, req.telegramUser.id);
      const inventory = cloneInventory(saveData);
      const lockedEntry = { itemId, itemType, name: metadata?.name, emoji: metadata?.emoji, rarity, quantity: qty, currency };

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

      const lockedInfo = buildLockedInfo({ itemId, itemType, name: metadata?.name, emoji: metadata?.emoji, rarity, quantity: qty });

      const { rows } = await client.query(
        `INSERT INTO market_orders
          (user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'open',$8)
         RETURNING id, user_id, item_id, item_type, rarity, currency, price, quantity_total, quantity_left, status, locked_items, created_at, updated_at`,
        [req.telegramUser.id, itemId, itemType, rarity || null, currency, unitPrice, qty, lockedInfo]
      );

      const orderRow = rows[0];
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

      await client.query(
        'UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1',
        [req.telegramUser.id, saveData, currentTimestamp()]
      );

      await client.query('COMMIT');

      const sellerReceives = unitPrice * qty * (1 - orderCommissionSell);
      return res.json({ order, sellerReceives });
    } catch (error) {
      await client.query('ROLLBACK');
      if (!error.statusCode) console.error('market create order error', error);
      return res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
    } finally {
      client.release();
    }
  } catch (error) {
    if (!error.statusCode) console.error('market create order validation error', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/market/orders/:order_id/buy', ensureTelegramAuth, async (req, res) => {
  const { quantity } = req.body || {};
  try {
    const qtyRequested = ensurePositiveInteger(quantity, 'quantity');
    const orderId = Number(req.params.order_id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order id' });
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
      if (Number(order.user_id) === Number(req.telegramUser.id)) {
        throw Object.assign(new Error('Нельзя покупать свою заявку'), { statusCode: 400 });
      }

      const quantityLeft = Number(order.quantity_left);
      const tradeQty = Math.min(qtyRequested, quantityLeft);
      const unitPrice = Number(order.price);
      const lockedInfo = parseLockedInfo(order.locked_items);
      if (!lockedInfo) {
        throw Object.assign(new Error('Заявка повреждена'), { statusCode: 400 });
      }

      const sellerSave = await fetchUserSaveForUpdate(client, order.user_id);
      const buyerSave = await fetchUserSaveForUpdate(client, req.telegramUser.id);

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

      // КРИТИЧНО: Сохраняем балансы ДО изменений для логирования
      const sellerBalanceBefore = order.currency === 'eco' ? (sellerSave.balance ?? 0) : (sellerSave.tonBalance ?? 0);
      const buyerBalanceBefore = order.currency === 'eco' ? (buyerSave.balance ?? 0) : (buyerSave.tonBalance ?? 0);

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

      // КРИТИЧНО: НЕ клонируем inventory продавца - это перезаписывает изменения баланса!
      // sellerSave.inventory уже существует и не меняется при покупке

      // КРИТИЧНО: Создаем НОВЫЕ объекты через JSON.stringify/parse для гарантии сохранения
      const nowTs = currentTimestamp();
      const sellerSaveToSave = JSON.parse(JSON.stringify(sellerSave));
      const buyerSaveToSave = JSON.parse(JSON.stringify(buyerSave));
      
      // Проверяем балансы после изменений
      const sellerBalanceAfter = order.currency === 'eco' ? sellerSaveToSave.balance : sellerSaveToSave.tonBalance;
      
      console.log(`[app.cjs market buy] Seller ${order.user_id}: balance ${sellerBalanceBefore} -> ${sellerBalanceAfter} (+${sellerReceives}), currency=${order.currency}`);
      console.log(`[app.cjs market buy] Buyer ${req.telegramUser.id}: balance ${buyerBalanceBefore} -> ${order.currency === 'eco' ? buyerSaveToSave.balance : buyerSaveToSave.tonBalance} (-${buyerPays})`);
      
      // КРИТИЧНО: Увеличиваем timestamp на 10ms чтобы гарантировать, что это сохранение будет самым новым
      // Это предотвратит перезапись автосохранением продавца
      const sellerUpdatedAt = nowTs + 10;
      
      // Сохраняем продавца СРАЗУ с явным приведением к JSONB и повышенным timestamp
      const sellerResult = await client.query(
        'UPDATE user_saves SET save_data = $2::jsonb, updated_at = $3 WHERE user_id = $1 RETURNING save_data, updated_at',
        [order.user_id, JSON.stringify(sellerSaveToSave), sellerUpdatedAt]
      );
      
      // Проверяем, что данные сохранились правильно
      if (sellerResult.rows && sellerResult.rows[0] && sellerResult.rows[0].save_data) {
        const savedBalance = order.currency === 'eco' 
          ? (sellerResult.rows[0].save_data.balance ?? 0)
          : (sellerResult.rows[0].save_data.tonBalance ?? 0);
        const savedUpdatedAt = sellerResult.rows[0].updated_at;
        console.log(`[app.cjs market buy] Seller data verified in DB: balance=${savedBalance}, updated_at=${savedUpdatedAt}`);
        if (Math.abs(savedBalance - sellerBalanceAfter) > 0.001) {
          console.error(`[app.cjs market buy] ERROR: Seller balance mismatch! Expected=${sellerBalanceAfter}, Got=${savedBalance}`);
        }
      } else {
        console.error(`[app.cjs market buy] ERROR: Seller data not saved! No rows returned.`);
      }
      
      // Сохраняем покупателя
      await client.query(
        'UPDATE user_saves SET save_data = $2::jsonb, updated_at = $3 WHERE user_id = $1',
        [req.telegramUser.id, JSON.stringify(buyerSaveToSave), nowTs]
      );

      const remaining = quantityLeft - tradeQty;
      lockedInfo.quantityLocked = remaining;
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
        [orderId, req.telegramUser.id, tradeQty, unitPrice, order.currency, commission]
      );

      await client.query('COMMIT');
      
      // ФИНАЛЬНАЯ ПРОВЕРКА: После коммита читаем данные из БД чтобы убедиться что все сохранилось
      const finalCheck = await pool.query(
        'SELECT save_data, updated_at FROM user_saves WHERE user_id = $1',
        [order.user_id]
      );
      if (finalCheck.rows && finalCheck.rows[0]) {
        const finalBalance = order.currency === 'eco' 
          ? (finalCheck.rows[0].save_data.balance ?? 0)
          : (finalCheck.rows[0].save_data.tonBalance ?? 0);
        console.log(`[app.cjs market buy] FINAL CHECK: Seller ${order.user_id} balance in DB after COMMIT: ${finalBalance}, updated_at: ${finalCheck.rows[0].updated_at}`);
        if (Math.abs(finalBalance - sellerBalanceAfter) > 0.001) {
          console.error(`[app.cjs market buy] CRITICAL ERROR: Final balance mismatch! Expected=${sellerBalanceAfter}, Got=${finalBalance}`);
        }
      }
      
      return res.json({
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
      if (!error.statusCode) console.error('market buy error', error);
      return res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
    } finally {
      client.release();
    }
  } catch (error) {
    if (!error.statusCode) console.error('market buy validation error', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/market/orders/:order_id/cancel', ensureTelegramAuth, async (req, res) => {
  const orderId = Number(req.params.order_id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM market_orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!rows.length) {
      throw Object.assign(new Error('Заявка не найдена'), { statusCode: 404 });
    }
    const order = rows[0];
    if (Number(order.user_id) !== Number(req.telegramUser.id)) {
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
        saveData.balance = roundAmount(Number(saveData.balance || 0) + quantityLeft);
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

    await client.query(
      'UPDATE user_saves SET save_data = $2, updated_at = $3 WHERE user_id = $1',
      [order.user_id, saveData, currentTimestamp()]
    );
    const lockedAfter = lockedInfo ? { ...lockedInfo, quantityLocked: 0 } : lockedInfo;
    await client.query(
      `UPDATE market_orders
       SET status = 'cancelled', quantity_left = 0, locked_items = $2, updated_at = NOW()
       WHERE id = $1`,
      [orderId, lockedAfter]
    );

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    if (!error.statusCode) console.error('market cancel error', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'DB error' });
  } finally {
    client.release();
  }
});

