const { logger } = require("console-wizard");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkForItem(stockData, keyword) {
  const all = [
    ...(stockData.stock.seed || []),
    ...(stockData.stock.gear || []),
    ...(stockData.stock.egg || []),
  ];
  return all.some((item) =>
    item.name.toLowerCase().includes(keyword.toLowerCase())
  );
}
async function collectRolesToPing(stockData) {
  const roleSet = new Set();
  const allGuildKeys = await db.all();

  for (const entry of allGuildKeys) {
    const guildData = entry.value;

    for (const category of ["seed", "gear", "egg"]) {
      const categoryItems = guildData[category] || {};

      for (const itemName in categoryItems) {
        const itemDisplayName = resolveItemName(category, itemName);
        const hasItem = checkForItem(stockData, itemDisplayName);

        if (hasItem) {
          if (category === "egg" && !isAtThirtyMinuteMark()) {
            logger.warn(`[Alert] Egg ${itemName} in stock, but skipping ping.`);
            continue;
          }

          const roleId = categoryItems[itemName].role;
          if (roleId) {
            roleSet.add(roleId);
          }
        }
      }
    }
  }

  return [...roleSet];
}

function resolveItemName(category, key) {
  const match = config.choices.find((c) => c.value === `${category}.${key}`);
  return match?.name || key;
}



function isInWindow(category) {
  const now = new Date();
  const mins = now.getMinutes();
  const secs = now.getSeconds();

  if (category === "egg") {
    return ((mins >= 0 && mins < 5) || (mins >= 30 && mins < 35)) && secs < 10;
  } else {
    return mins % 5 === 0 && secs < 10;
  }
}

async function canSendPing(guildId, roleId, category) {
  if (!isInWindow(category)) {
    logger.error(`[Role] ${roleId} isn't in window.`);
    return false;
  }

  if (category !== "egg") {
    return true;
  }

  const key = `lastPing_${guildId}_${roleId}_${category}`;
  const lastPing = await db.get(key);
  const now = Date.now();

  if (lastPing && now - lastPing < 30 * 60 * 1000) {
    logger.warn(`[Role] ${roleId} Egg cooldown still active.`);
    return false;
  }

  await db.set(key, now);
  return true;
}


let client = null;
function setClient(c) {
  client = c;
}
function getClient() {
  return client;
}



module.exports = {
  sleep,
  checkForItem,
  collectRolesToPing,
  canSendPing,
  setClient,
  getClient
};
