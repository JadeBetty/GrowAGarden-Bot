const { logger } = require("console-wizard");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilNextFiveMinuteMark() {
  const now = new Date();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const ms = now.getMilliseconds();

  const nextMins = Math.ceil((mins + 1) / 5) * 5;
  const diffMins = nextMins - mins;
  let waitMs = diffMins * 60 * 1000 - secs * 1000 - ms;

  if (waitMs <= 0) {
    waitMs = 5 * 60 * 1000 + waitMs;
  }

  logger.info(
    `[Alert] Next 5-min mark in ${Math.round(waitMs / 1000)} seconds`
  );
  await sleep(waitMs);
}

async function waitUntilNextThirtyMinuteMark() {
  const now = new Date();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const ms = now.getMilliseconds();

  let nextTargetMinutes = mins < 30 ? 30 : 60;
  let diffMins = nextTargetMinutes - mins;

  let waitMs = diffMins * 60 * 1000 - secs * 1000 - ms;

  logger.info(
    `[Alert] Next 30-min mark in ${Math.round(waitMs / 1000)} seconds`
  );
  await sleep(waitMs);
}

function checkForItem(stockData, keyword) {
  const all = [
    ...(stockData.stock.seeds || []),
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

function isAtThirtyMinuteMark() {
  const mins = new Date().getMinutes();
  return mins < 5 || (mins >= 30 && mins < 35);
}

const merchantHoursUTC = [0, 4, 8, 12, 16, 20];

function getNextMerchantTime() {
  const now = new Date();
  const nowUnix = Math.floor(now.getTime() / 1000);

  const baseDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const spawnTimes = [];

  for (let d = 0; d <= 1; d++) {
    for (const hour of merchantHoursUTC) {
      const spawnTime = new Date(baseDate.getTime() + d * 86400000);
      spawnTime.setUTCHours(hour, 0, 0, 0);
      spawnTimes.push(Math.floor(spawnTime.getTime() / 1000));
    }
  }

  const next = spawnTimes.find((unix) => unix > nowUnix);
  return next;
}

function resolveItemName(category, key) {
  const match = config.choices.find((c) => c.value === `${category}.${key}`);
  return match?.name || key;
}

module.exports = {
  sleep,
  waitUntilNextFiveMinuteMark,
  checkForItem,
  collectRolesToPing,
  isAtThirtyMinuteMark,
  waitUntilNextThirtyMinuteMark,
  getNextMerchantTime,
};
