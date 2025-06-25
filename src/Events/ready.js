const Discord = require("discord.js");
const { updateStock } = require("../functions/getstock");
// const { updateWeather } = require("../functions/getweather"); isn't working yet.
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../config.json");
const { logger } = require("console-wizard");
const { updateWeather } = require("../functions/getweather");

module.exports = {
  event: "ready",
  async run(client) {
    const stockChannel = await client.channels.fetch("1381637521728868474");
    let lastUpdatedAt = null;
    logger.success(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Grow A Garden", {
      type: Discord.ActivityType.Playing,
    });

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
        waitMs = 5 * 60 * 1000 + waitMs; // Add 5 minutes
      }

      logger.info(`Next 5-min mark in ${Math.round(waitMs / 1000)} seconds`);
      await sleep(waitMs);
    }

    function isAtThirtyMinuteMark() {
      const mins = new Date().getMinutes();
      return mins < 5 || (mins >= 30 && mins < 35);
    }

    async function startStockLoop() {
      let {
        embed: firstEmbed,
        updatedAt: firstUpdatedAt,
        rawData,
      } = await updateStock();
      lastUpdatedAt = firstUpdatedAt;
      const pingRoles = await collectRolesToPing(rawData);
      const pingContent = pingRoles.length
        ? pingRoles.map((id) => `<@&${id}>`).join(" ")
        : null;

      await stockChannel.send({
        content: pingContent,
        embeds: [firstEmbed],
      });
      logger.success(
        `[Stock] Sent initial embed${
          pingRoles === null
            ? "s without any role pings."
            : ` with role pings: ${pingRoles}`
        }`
      );
      logger.info(
        `Last updated: ${new Date(rawData.Data.updatedAt).toLocaleTimeString()}`
      );
      logger.table(rawData.Data.gear);
      logger.table(rawData.Data.seeds);
      logger.table(rawData.Data.egg);
      await handleUserDMs(rawData);

      // Add flag to skip first check after startup
      let isFirstCheck = true;

      while (true) {
        await waitUntilNextFiveMinuteMark();

        // Skip the first check after startup since we just sent the initial embed
        if (isFirstCheck) {
          logger.info(
            "[Stock] Skipping first check after startup - using current data as baseline"
          );
          isFirstCheck = false;
          continue;
        }

        // Wait an additional 10 seconds after the 5-minute mark to ensure stock has updated
        logger.info("[Stock] Waiting 5 seconds for stock server to update...");
        await sleep(1 * 1000);

        let freshEmbed = null;
        let newRawData = null;
        let changed = false;
        let lastDataString = JSON.stringify({
          seeds: rawData.Data.seeds,
          gear: rawData.Data.gear,
          egg: rawData.Data.egg,
        });

        while (!changed) {
          const stockUpdate = await updateStock();
          const newDataString = JSON.stringify({
            seeds: stockUpdate.rawData.Data.seeds,
            gear: stockUpdate.rawData.Data.gear,
            egg: stockUpdate.rawData.Data.egg,
          });

          if (newDataString !== lastDataString) {
            lastUpdatedAt = stockUpdate.updatedAt * 1000;
            lastDataString = newDataString;
            freshEmbed = stockUpdate.embed;
            newRawData = stockUpdate.rawData;
            rawData = stockUpdate.rawData;
            changed = true;
            logger.success(
              `[Stock] New stock detected. ${new Date(
                stockUpdate.updatedAt * 1000
              ).toLocaleTimeString()}`
            );
          } else {
            logger.error(`[Stock] Hasn't updated, retrying every 5s.`);
          }
          await sleep(5 * 1000);
        }

        if (freshEmbed) {
          const pingRoles = await collectRolesToPing(newRawData);
          const pingContent = pingRoles.length
            ? pingRoles.map((id) => `<@&${id}>`).join(" ")
            : null;

          await stockChannel.send({
            content: pingContent,
            embeds: [freshEmbed],
          });

          logger.success(
            `[Stock] Sent new embed${
              pingRoles.length === 0
                ? "s without any role pings."
                : ` with role pings: ${pingRoles}`
            }`
          );
          await handleUserDMs(newRawData);
        }
      }
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

    async function handleUserDMs(stockData) {
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
                  `[Alert] Egg ${itemName} in stock, but skipping notification after 5 mins of the half-hour, hour.`
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

    async function startWeatherLoop() {
      const weather = await updateWeather();
      if (weather === null) return;
      await stockChannel.send({ embeds: weather.embeds });
      logger.success(`[Weather] Sent initial weather embed.`);
      setInterval(async () => {
        const weather = await updateWeather();
        if (weather === null) return;
        await stockChannel.send({ embeds: weather.embeds });
        logger.success(`[Weather] Sent new weather embed.`);
      }, 90 * 1000);
    }

    startWeatherLoop();
    startStockLoop();
  },
};
