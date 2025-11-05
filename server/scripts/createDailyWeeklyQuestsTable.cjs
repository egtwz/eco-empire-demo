const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
CREATE TABLE IF NOT EXISTS daily_weekly_quests (
  id              SERIAL PRIMARY KEY,
  quest_type      VARCHAR(10) NOT NULL CHECK (quest_type IN ('daily', 'weekly')),
  quest_id        VARCHAR(50) NOT NULL,
  updated_at      BIGINT NOT NULL,
  expires_at      BIGINT NOT NULL,
  UNIQUE(quest_type)
);

CREATE INDEX IF NOT EXISTS idx_quest_type ON daily_weekly_quests(quest_type);
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Daily/Weekly quests table created/updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create daily/weekly quests table', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();



