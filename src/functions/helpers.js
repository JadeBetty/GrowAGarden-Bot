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

  logger.info(`[Alert] Next 5-min mark in ${Math.round(waitMs / 1000)} seconds`);
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

  logger.info(`[Alert] Next 30-min mark in ${Math.round(waitMs / 1000)} seconds`);
  await sleep(waitMs);
}


function checkForItem(stockData, keyword) {
  const all = [
    ...(stockData.Data.seeds || []),
    ...(stockData.Data.gear || []),
    ...(stockData.Data.egg || []),
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
        const hasItem = checkForItem(stockData, itemName);

        if (hasItem) {
          if (category === "egg" && !isAtThirtyMinuteMark()) {
            logger.warn(
              `[Alert] Egg ${itemName} in stock, but skipping **ping**.`
            );
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

module.exports = {
  sleep,
  waitUntilNextFiveMinuteMark,
  checkForItem,
  collectRolesToPing,
  isAtThirtyMinuteMark,
  waitUntilNextThirtyMinuteMark
};