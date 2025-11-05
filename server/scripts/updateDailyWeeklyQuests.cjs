const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Список ID ежедневных квестов (52 штуки)
const dailyQuestIds = [
  'daily_001', 'daily_002', 'daily_003', 'daily_004', 'daily_005', 'daily_006', 'daily_007', 'daily_008',
  'daily_009', 'daily_010', 'daily_011', 'daily_012', 'daily_013', 'daily_014', 'daily_015', 'daily_016',
  'daily_017', 'daily_018', 'daily_019', 'daily_020', 'daily_021', 'daily_022', 'daily_023', 'daily_024',
  'daily_025', 'daily_026', 'daily_027', 'daily_028', 'daily_029', 'daily_030', 'daily_031', 'daily_032',
  'daily_033', 'daily_034', 'daily_035', 'daily_036', 'daily_037', 'daily_038', 'daily_039', 'daily_040',
  'daily_041', 'daily_042', 'daily_043', 'daily_044', 'daily_045', 'daily_046', 'daily_047', 'daily_048',
  'daily_049', 'daily_050', 'daily_051', 'daily_052'
];

// Список ID еженедельных квестов (38 штук)
const weeklyQuestIds = [
  'weekly_001', 'weekly_002', 'weekly_003', 'weekly_004', 'weekly_005', 'weekly_006', 'weekly_007',
  'weekly_008', 'weekly_009', 'weekly_010', 'weekly_011', 'weekly_012', 'weekly_013', 'weekly_014',
  'weekly_015', 'weekly_016', 'weekly_017', 'weekly_018', 'weekly_019', 'weekly_020', 'weekly_021',
  'weekly_022', 'weekly_023', 'weekly_024', 'weekly_025', 'weekly_026', 'weekly_027', 'weekly_028',
  'weekly_029', 'weekly_030', 'weekly_031', 'weekly_032', 'weekly_033', 'weekly_034', 'weekly_035',
  'weekly_036', 'weekly_037', 'weekly_038'
];

function getMoscowTime() {
  const now = new Date();
  const mskOffset = 3 * 60 * 60 * 1000; // МСК = UTC+3
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const mskTime = new Date(utcTime + mskOffset);
  return mskTime;
}

function getNextMidnightMsk() {
  const mskTime = getMoscowTime();
  const nextMidnight = new Date(mskTime);
  nextMidnight.setHours(24, 0, 0, 0);
  const mskOffset = 3 * 60 * 60 * 1000;
  return nextMidnight.getTime() - mskOffset; // Конвертируем в UTC timestamp
}

function getNextMondayMidnightMsk() {
  const mskTime = getMoscowTime();
  const daysUntilMonday = (8 - mskTime.getDay()) % 7 || 7;
  const nextMonday = new Date(mskTime);
  nextMonday.setDate(mskTime.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const mskOffset = 3 * 60 * 60 * 1000;
  return nextMonday.getTime() - mskOffset; // Конвертируем в UTC timestamp
}

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = Date.now();

    // Обновляем ежедневный квест
    const dailyQuestId = dailyQuestIds[Math.floor(Math.random() * dailyQuestIds.length)];
    const dailyExpiresAt = getNextMidnightMsk();

    await client.query(
      `INSERT INTO daily_weekly_quests (quest_type, quest_id, updated_at, expires_at)
       VALUES ('daily', $1, $2, $3)
       ON CONFLICT (quest_type) DO UPDATE
       SET quest_id = excluded.quest_id,
           updated_at = excluded.updated_at,
           expires_at = excluded.expires_at`,
      [dailyQuestId, now, dailyExpiresAt]
    );

    console.log(`[updateDailyWeeklyQuests] Daily quest updated: ${dailyQuestId}, expires at: ${new Date(dailyExpiresAt).toISOString()}`);

    // Обновляем еженедельный квест только если это понедельник 00:00 МСК
    const mskTime = getMoscowTime();
    const mskDay = mskTime.getDay();
    const mskHours = mskTime.getHours();
    const mskMinutes = mskTime.getMinutes();

    if (mskDay === 1 && mskHours === 0 && mskMinutes < 5) {
      // Обновляем еженедельный квест только в понедельник около полуночи
      const weeklyQuestId = weeklyQuestIds[Math.floor(Math.random() * weeklyQuestIds.length)];
      const weeklyExpiresAt = getNextMondayMidnightMsk();

      await client.query(
        `INSERT INTO daily_weekly_quests (quest_type, quest_id, updated_at, expires_at)
         VALUES ('weekly', $1, $2, $3)
         ON CONFLICT (quest_type) DO UPDATE
         SET quest_id = excluded.quest_id,
             updated_at = excluded.updated_at,
             expires_at = excluded.expires_at`,
        [weeklyQuestId, now, weeklyExpiresAt]
      );

      console.log(`[updateDailyWeeklyQuests] Weekly quest updated: ${weeklyQuestId}, expires at: ${new Date(weeklyExpiresAt).toISOString()}`);
    } else {
      console.log(`[updateDailyWeeklyQuests] Weekly quest not updated (not Monday 00:00 MSK). Current: Day=${mskDay}, Time=${mskHours}:${mskMinutes}`);
    }

    await client.query('COMMIT');
    console.log('[updateDailyWeeklyQuests] Quests updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateDailyWeeklyQuests] Failed to update quests', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();


