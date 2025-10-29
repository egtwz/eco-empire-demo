const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Datastore = require('nedb-promises');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

const saves = Datastore.create({ filename: path.join(__dirname, 'user_saves.db'), autoload: true });
const stats = Datastore.create({ filename: path.join(__dirname, 'user_stats.db'), autoload: true });

function parseUserId(req, res, next) {
  const { user_id } = req.params;
  if (!user_id || !/^[0-9]+$/.test(user_id)) {
    return res.status(400).json({ error: 'Invalid user_id' });
  }
  next();
}

// Saves
app.get('/api/save/:user_id', parseUserId, async (req, res) => {
  const row = await saves.findOne({ user_id: req.params.user_id });
  if (!row) return res.status(404).json({ error: 'Not found' });
  return res.json({ save_data: row.save_data, updated_at: row.updated_at });
});

app.post('/api/save/:user_id', parseUserId, async (req, res) => {
  const { save_data, updated_at } = req.body || {};
  if (!save_data || !updated_at) return res.status(400).json({ error: 'Missing payload' });
  try {
    await saves.update(
      { user_id: req.params.user_id },
      { user_id: req.params.user_id, save_data, updated_at },
      { upsert: true }
    );
    return res.json({ ok: true, updated_at });
  } catch (e) {
    return res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/save/:user_id', parseUserId, async (req, res) => {
  const { save_data, updated_at, last_client_known } = req.body || {};
  if (!save_data || !updated_at) return res.status(400).json({ error: 'Missing payload' });
  const row = await saves.findOne({ user_id: req.params.user_id });
  if (row && row.updated_at > (last_client_known || 0)) {
    return res.status(409).json({ error: 'Conflict', updated_at: row.updated_at });
  }
  try {
    await saves.update(
      { user_id: req.params.user_id },
      { user_id: req.params.user_id, save_data, updated_at },
      { upsert: true }
    );
    return res.json({ ok: true, updated_at });
  } catch (e) {
    return res.status(500).json({ error: 'DB error' });
  }
});

// Stats
app.post('/api/stats/update', async (req, res) => {
  const { user_id, inc_session, time_spent = 0, achievements = [], custom_stats = {} } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const now = Date.now();
  const row = await stats.findOne({ user_id: String(user_id) });
  if (!row) {
    await stats.insert({
      user_id: String(user_id),
      first_seen: now,
      last_seen: now,
      session_count: inc_session ? 1 : 0,
      total_time_spent: time_spent,
      achievements: JSON.stringify(achievements),
      custom_stats: JSON.stringify(custom_stats),
    });
  } else {
    await stats.update(
      { user_id: String(user_id) },
      {
        ...row,
        last_seen: now,
        session_count: row.session_count + (inc_session ? 1 : 0),
        total_time_spent: row.total_time_spent + time_spent,
      }
    );
  }
  return res.json({ ok: true });
});

app.get('/api/stats/summary', async (_req, res) => {
  const all = await stats.find({});
  const summary = all.reduce((acc, s) => {
    acc.users += 1;
    acc.sessions += s.session_count || 0;
    acc.total_time += s.total_time_spent || 0;
    return acc;
  }, { users: 0, sessions: 0, total_time: 0 });
  return res.json(summary);
});

app.get('/api/stats/users/count', async (_req, res) => {
  const count = await stats.count({});
  return res.json({ users: count });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('API server listening on', PORT);
});
