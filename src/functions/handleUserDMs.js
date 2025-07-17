const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { checkForItem } = require("./helpers.js")
const config = require("../../config.json");
const { logger } = require("console-wizard");

async function handleUserDMs(stockData, client) {
  const allGuildKeys = await db.all();
  const now = new Date();
  function getExpiryUnix(category) {
    if (category === "egg") {
      const msPer30Min = 30 * 60 * 1000;
      const nextExpiry30 = new Date(
        Math.ceil(now.getTime() / msPer30Min) * msPer30Min
      );
      nextExpiry30.setSeconds(nextExpiry30.getSeconds() - 2);
      return Math.floor(nextExpiry30.getTime() / 1000);
    } else {
      const msPer5Min = 5 * 60 * 1000;
      const nextExpiry5 = new Date(
        Math.ceil(now.getTime() / msPer5Min) * msPer5Min
      );
      nextExpiry5.setSeconds(nextExpiry5.getSeconds() - 2);
      return Math.floor(nextExpiry5.getTime() / 1000);
    }
  }

  for (const entry of allGuildKeys) {
    const guildData = entry.value;
    for (const category of ["seed", "gear", "egg"]) {
      const categoryItems = guildData[category] || {};

      for (const itemName in categoryItems) {
        const hasItem = checkForItem(stockData, itemName);
        if (hasItem) {
          if (category === "egg" && !isAtThirtyMinuteMark()) {
            logger.warn(
              `[Alert] Egg ${itemName} in stock, but skipping notification.`
            );
            continue;
          }
          const users = categoryItems[itemName].users || [];
          const pretty =
            config.choices.find(
              (choice) => choice.value === `${category}.${itemName}`
            )?.name || `${category}.${itemName}`;

          const expiryUnix = getExpiryUnix(category);

          for (const userId of users) {
            const user = await client.users.fetch(userId).catch(() => null);
            if (user) {
              await user.send(
                `🔔 **${pretty}** is now in stock!\n⏰ Expires at: <t:${expiryUnix}:t>`
              );
            }
          }
        }
      }
    }
  }
}

function isAtThirtyMinuteMark() {
  const mins = new Date().getMinutes();
  return mins < 5 || (mins >= 30 && mins < 35);
}

module.exports = {
  handleUserDMs,
};