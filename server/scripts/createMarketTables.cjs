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
CREATE TABLE IF NOT EXISTS market_orders (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  item_id         TEXT NOT NULL,
  item_type       TEXT NOT NULL CHECK (item_type IN ('seed', 'fruit')),
  rarity          TEXT,
  currency        TEXT NOT NULL CHECK (currency IN ('eco', 'ton')),
  price           NUMERIC(18,6) NOT NULL CHECK (price > 0),
  quantity_total  INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_left   INTEGER NOT NULL CHECK (quantity_left >= 0),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  locked_items    JSONB,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_orders_status_currency ON market_orders (status, currency);
CREATE INDEX IF NOT EXISTS idx_market_orders_item ON market_orders (item_id, status);
CREATE INDEX IF NOT EXISTS idx_market_orders_user ON market_orders (user_id, status);

CREATE TABLE IF NOT EXISTS market_trades (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES market_orders(id) ON DELETE CASCADE,
  buyer_id    BIGINT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  price       NUMERIC(18,6) NOT NULL CHECK (price > 0),
  currency    TEXT NOT NULL CHECK (currency IN ('eco', 'ton')),
  commission  NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_trades_order ON market_trades (order_id);
CREATE INDEX IF NOT EXISTS idx_market_trades_buyer ON market_trades (buyer_id);
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('Market tables created/updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create market tables', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

