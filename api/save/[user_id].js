import { Pool } from 'pg';
import crypto from 'node:crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function verifyTelegramInitData(rawInitData) {
  if (!rawInitData) return null;

  const params = new URLSearchParams(rawInitData);
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  const hash = data.hash;
  if (!hash) return null;
  delete data.hash;

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.warn('[api/save] BOT_TOKEN env not set – Telegram verification skipped');
    return null;
  }

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

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
      console.error('[api/save] Failed to parse user JSON', error);
      return null;
    }
  }

  return {
    user,
    authDate: data.auth_date ? Number(data.auth_date) : undefined,
    queryId: data.query_id,
  };
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const { user_id: paramId } = req.query;
  const userId = Array.isArray(paramId) ? paramId[0] : paramId;

  if (!userId || !/^\d+$/.test(userId)) {
    res.status(400).json({ error: 'Invalid user_id' });
    return;
  }

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      body = await readJsonBody(req);
    } catch (error) {
      console.error('[api/save] Failed to parse body', error);
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }

  const rawInitData = req.headers['x-telegram-init-data'] || body.__telegramInitData;
  const verified = verifyTelegramInitData(rawInitData);

  if (!verified || !verified.user?.id) {
    res.status(401).json({ error: 'Invalid Telegram init data' });
    return;
  }

  if (Number(verified.user.id) !== Number(userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'select save_data, updated_at from user_saves where user_id = $1',
        [userId]
      );
      if (!rows.length) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json(rows[0]);
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { save_data, updated_at, last_client_known } = body || {};
      if (!save_data || !updated_at) {
        res.status(400).json({ error: 'Missing payload' });
        return;
      }

      if (req.method === 'PUT') {
        const existing = await pool.query(
          'select updated_at from user_saves where user_id = $1',
          [userId]
        );
        if (existing.rowCount && existing.rows[0].updated_at > (last_client_known || 0)) {
          res.status(409).json({ error: 'Conflict', updated_at: existing.rows[0].updated_at });
          return;
        }
      }

      await pool.query(
        `insert into user_saves (user_id, save_data, updated_at)
         values ($1, $2, $3)
         on conflict (user_id) do update set save_data = excluded.save_data, updated_at = excluded.updated_at`,
        [userId, save_data, updated_at]
      );

      res.status(200).json({ ok: true, updated_at });
      return;
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[api/save] DB error', error);
    res.status(500).json({ error: 'DB error', details: error?.message ?? String(error) });
  }
}

