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
    const existing = await pool.query(
      'select updated_at from user_saves where user_id = $1',
      [req.params.user_id]
    );
    if (existing.rowCount && existing.rows[0].updated_at > (last_client_known || 0)) {
      return res.status(409).json({ error: 'Conflict', updated_at: existing.rows[0].updated_at });
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

module.exports = app;

