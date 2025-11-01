function ensurePositiveInteger(value, name) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    const err = new Error(`${name} must be a positive integer`);
    err.statusCode = 400;
    throw err;
  }
  return num;
}

function ensurePositiveNumber(value, name) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    const err = new Error(`${name} must be a positive number`);
    err.statusCode = 400;
    throw err;
  }
  return num;
}

function roundAmount(value, precision = 3) {
  const factor = Math.pow(10, precision);
  return Number(Math.round(((value ?? 0) + Number.EPSILON) * factor) / factor);
}

function cloneInventory(saveData) {
  if (!saveData || !Array.isArray(saveData.inventory)) return [];
  return saveData.inventory.map((item) => ({ ...item }));
}

function ensureMarketLocked(saveData) {
  if (!Array.isArray(saveData.marketLocked)) {
    saveData.marketLocked = [];
  }
  return saveData.marketLocked;
}

function findInventoryItem(inventory, itemId, itemType) {
  return inventory.find((entry) => entry.id === itemId && entry.type === itemType);
}

function changeInventoryQuantity(inventory, { itemId, itemType, delta, name, emoji, rarity }) {
  let entry = findInventoryItem(inventory, itemId, itemType);
  if (delta < 0) {
    if (!entry || entry.count + delta < 0) {
      const err = new Error('Недостаточно предметов для операции');
      err.statusCode = 400;
      throw err;
    }
    entry.count += delta;
    if (entry.count === 0) {
      const idx = inventory.indexOf(entry);
      if (idx !== -1) inventory.splice(idx, 1);
    }
  } else if (delta > 0) {
    if (!entry) {
      entry = {
        id: itemId,
        type: itemType,
        count: 0,
        name: name || 'Unknown',
        emoji: emoji || '❓',
        rarity,
      };
      inventory.push(entry);
    }
    entry.count += delta;
    if (rarity) entry.rarity = rarity;
    if (name) entry.name = name;
    if (emoji) entry.emoji = emoji;
  }
}

function buildLockedInfo({ itemId, itemType, name, emoji, rarity, quantity }) {
  return {
    itemId,
    itemType,
    name: name || 'Unknown',
    emoji: emoji || '❓',
    rarity,
    quantityLocked: quantity,
  };
}

function parseLockedInfo(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && raw.itemId) return raw;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && parsed.itemId) return parsed;
  } catch {}
  return null;
}

function formatOrderRow(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    itemId: row.item_id,
    itemType: row.item_type,
    rarity: row.rarity,
    currency: row.currency,
    price: Number(row.price),
    quantityTotal: Number(row.quantity_total),
    quantityLeft: Number(row.quantity_left),
    status: row.status,
    locked: parseLockedInfo(row.locked_items),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function calculateTradeAmounts(price, quantity) {
  const base = roundAmount(price * quantity);
  const sellerReceives = roundAmount(base * 0.98);
  const buyerPays = roundAmount(base * 1.02);
  const commission = roundAmount(base * 0.04);
  return { base, sellerReceives, buyerPays, commission };
}

async function fetchUserSaveForUpdate(client, userId) {
  const { rows } = await client.query('select save_data from user_saves where user_id = $1 for update', [userId]);
  if (!rows.length || !rows[0].save_data) {
    const err = new Error('Профиль пользователя не найден');
    err.statusCode = 404;
    throw err;
  }
  return rows[0].save_data;
}

function currentTimestamp() {
  return Date.now();
}

function adjustMarketLocked(entries, orderId, updateFn) {
  const idx = entries.findIndex((entry) => Number(entry.orderId) === Number(orderId));
  if (idx === -1) return entries;
  const updated = updateFn({ ...entries[idx] });
  if (!updated) {
    entries.splice(idx, 1);
  } else {
    entries[idx] = updated;
  }
  return entries;
}

module.exports = {
  ensurePositiveInteger,
  ensurePositiveNumber,
  cloneInventory,
  ensureMarketLocked,
  findInventoryItem,
  changeInventoryQuantity,
  buildLockedInfo,
  parseLockedInfo,
  formatOrderRow,
  calculateTradeAmounts,
  fetchUserSaveForUpdate,
  currentTimestamp,
  adjustMarketLocked,
  roundAmount,
};
