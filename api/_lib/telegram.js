import crypto from 'node:crypto';

export function verifyTelegramInitData(rawInitData) {
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
    console.warn('[api] BOT_TOKEN env not set – Telegram verification skipped');
    return null;
  }

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (checkHash !== hash) return null;

  let user = null;
  if (data.user) {
    try {
      user = JSON.parse(data.user);
    } catch (error) {
      console.error('[api] Failed to parse user JSON', error);
      return null;
    }
  }

  return {
    user,
    authDate: data.auth_date ? Number(data.auth_date) : undefined,
    queryId: data.query_id,
  };
}

export async function readJsonBody(req) {
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

