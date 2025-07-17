const { logger } = require("console-wizard");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function resolveItemName(category, key) {
  const match = config.choices.find((c) => c.value === `${category}.${key}`);
  return match?.name || key;
}

module.exports = {
  sleep,
  checkForItem,
  collectRolesToPing,
};
