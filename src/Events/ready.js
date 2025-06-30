const Discord = require("discord.js");
const { updateStock } = require("../functions/getstock");
const { updateWeather } = require("../functions/getweather");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../config.json");
const { logger } = require("console-wizard");

const recentlyPinged = new Map();

// In-memory cache for guild channels
const guildChannelsCache = new Map();

module.exports = {
  event: "ready",
  async run(client) {
    logger.success(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Grow A Garden", {
      type: Discord.ActivityType.Playing,
    });

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Load all guild channel info into cache
    async function loadGuildChannelsCache() {
      const allGuilds = await db.all();
      guildChannelsCache.clear();
      for (const entry of allGuilds) {
        if (!entry.id.startsWith("guild_")) continue;
        const guildId = entry.id.split("_")[1];
        const guildData = entry.value || {};
        const stockChannelId = guildData.channels?.stock || null;
        const weatherChannelId = guildData.channels?.weather || null;

        guildChannelsCache.set(guildId, { stockChannelId, weatherChannelId });
      }
      logger.info(
        `Loaded guild channels cache: ${guildChannelsCache.size} guilds.`
      );
    }

    // Call this to update cache for a single guild when needed
    async function updateGuildCache(guildId) {
      const guildData = await db.get(`guild_${guildId}`);
      const stockChannelId = guildData?.channels?.stock || null;
      const weatherChannelId = guildData?.channels?.weather || null;
      guildChannelsCache.set(guildId, { stockChannelId, weatherChannelId });
      logger.info(`Updated cache for guild ${guildId}`);
    }

    // Safe send helper
    async function sendToChannel(channelId, content, embeds) {
      if (!channelId) return false;
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) return false;
        await channel.send({
          content,
          embeds: embeds
            ? Array.isArray(embeds)
              ? embeds
              : [embeds]
            : undefined,
        });

        return true;
      } catch (error) {
        logger.warn(
          `Failed to send message to channel ${channelId}: ${error.message}`
        );
        return false;
      }
    }

    // Your other existing helper functions...

    // STOCK LOOP
    async function startStockLoop() {
      await loadGuildChannelsCache(); // load cache at start

      let {
        embed: firstEmbed,
        updatedAt: firstUpdatedAt,
        rawData,
      } = await updateStock();

      let lastUpdatedAt = firstUpdatedAt;

      // Prepare ping content once
      const pingRoles = await collectRolesToPing(rawData);
      const pingContent = pingRoles.length
        ? pingRoles.map((id) => `<@&${id}>`).join(" ")
        : null;

      // Send to all guild stock channels using cache
      for (const [
        guildId,
        { stockChannelId },
      ] of guildChannelsCache.entries()) {
        if (!stockChannelId) {
          logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
          continue;
        }
        await sendToChannel(stockChannelId, pingContent, firstEmbed);
      }

      logger.success(
        `[Stock] Sent initial embeds to all guild stock channels.`
      );

      await handleUserDMs(rawData);

      let isFirstCheck = true;

      while (true) {
        await waitUntilNextFiveMinuteMark();

        if (isFirstCheck) {
          logger.info(
            "[Stock] Skipping first check after startup - baseline data."
          );
          isFirstCheck = false;
          continue;
        }

        // logger.info("[Stock] Waiting 1 second for stock update...");
        // await sleep(1 * 1000);

        let freshEmbed = null;
        let changed = false;
        let lastDataString = JSON.stringify({
          seeds: rawData.Data.seeds,
          gear: rawData.Data.gear,
          egg: rawData.Data.egg,
        });
        const startTime = Date.now(); // start time

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
            rawData = stockUpdate.rawData;
            changed = true;
            logger.success(
              `[Stock] New stock detected at ${new Date(
                lastUpdatedAt
              ).toLocaleTimeString()}`
            );
          } else {
            logger.error(`[Stock] No update yet, retrying in 1s.`);
            await sleep(1 * 1000);
          }

          // Check if 60 seconds passed
          if (Date.now() - startTime > 60 * 1000) {
            logger.warn(
              `[Stock] No new update after 1 minute. Skipping this cycle.`
            );
            break;
          }

          // await sleep(1 * 1000);
        }

        if (freshEmbed) {
          const pingRoles = await collectRolesToPing(rawData);
          const pingContent = pingRoles.length
            ? pingRoles.map((id) => `<@&${id}>`).join(" ")
            : null;

          // Use cached channels for sending updates
          for (const [
            guildId,
            { stockChannelId },
          ] of guildChannelsCache.entries()) {
            if (!stockChannelId) {
              logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
              continue;
            }
            await sendToChannel(stockChannelId, pingContent, freshEmbed);
          }

          logger.success(
            `[Stock] Sent new embed${
              pingRoles.length === 0
                ? "s without any role pings."
                : ` with role pings: ${pingRoles}`
            }`
          );
          await handleUserDMs(rawData);
        }
      }
    }

    // WEATHER LOOP
    async function startWeatherLoop() {
      await loadGuildChannelsCache(); // load cache at start

      async function sendWeather() {
        const weather = await updateWeather();
        if (weather === null) return;

        for (const [
          guildId,
          { weatherChannelId },
        ] of guildChannelsCache.entries()) {
          if (!weatherChannelId) {
            logger.warn(
              `[Weather] No weather channel set for guild ${guildId}`
            );
            continue;
          }
          await sendToChannel(weatherChannelId, null, weather.embeds);
        }

        logger.success(
          `[Weather] Sent weather embeds to all guild weather channels.`
        );

        setTimeout(sendWeather, weather.weather[0].duration * 1000);
      }

      await sendWeather();
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
                  `[Alert] Egg ${itemName} in stock, but skipping **ping** after 5 mins of the half-hour, hour.`
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
    startWeatherLoop();
    startStockLoop();

    setInterval(async () => {
      logger.info("Refreshing guild channels cache...");
      await loadGuildChannelsCache();
    }, 10 * 60 * 1000); // 10 minutes
  },
};
