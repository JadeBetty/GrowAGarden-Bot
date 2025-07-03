const Discord = require("discord.js");
const {
  updateStock,
  updateWeather,
  sleep,
  waitUntilNextFiveMinuteMark,
  collectRolesToPing,
  sendToChannel,
  loadGuildChannelsCache,
  handleUserDMs,
  updateEventStock,
  waitUntilNextThirtyMinuteMark,
  guildChannelsCache,
} = require("../functions");
const { logger } = require("console-wizard");

module.exports = {
  event: "ready",
  async run(client) {
    logger.success(`[Event] Logged in as ${client.user.tag}`);
    client.user.setActivity("Grow A Garden", {
      type: Discord.ActivityType.Playing,
    });

    async function startStockLoop() {
      await loadGuildChannelsCache();

      let {
        embed: firstEmbed,
        updatedAt: firstUpdatedAt,
        rawData,
      } = await updateStock();

      let lastUpdatedAt = firstUpdatedAt;

      const pingRoles = await collectRolesToPing(rawData);
      const pingContent = pingRoles.length
        ? pingRoles.map((id) => `<@&${id}>`).join(" ")
        : null;

      for (const [
        guildId,
        { stockChannelId },
      ] of guildChannelsCache.entries()) {
        if (!stockChannelId) {
          logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
          continue;
        }
        await sendToChannel(stockChannelId, pingContent, firstEmbed, client);
      }

      logger.success(
        `[Stock] Sent initial embeds to all guild stock channels.`
      );

      await handleUserDMs(rawData, client);

      // let isFirstCheck = true;

      while (true) {
        await waitUntilNextFiveMinuteMark();

        // if (isFirstCheck) {
        //   const skipEmbed = new Discord.EmbedBuilder()
        //     .setTitle("📊 Stock Check Skipped")
        //     .setDescription(
        //       "Skipping first stock check after startup — using baseline data."
        //     )
        //     .setColor(0xffcc00)
        //     .setTimestamp();

        //   for (const [
        //     guildId,
        //     { stockChannelId },
        //   ] of guildChannelsCache.entries()) {
        //     if (!stockChannelId) {
        //       logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
        //       continue;
        //     }
        //     await sendToChannel(stockChannelId, null, skipEmbed, client);
        //   }

        //   logger.info(
        //     "[Stock] Skipped first check after startup — baseline sent."
        //   );
        //   isFirstCheck = false;
        //   continue;
        // }

        logger.info("[Stock] Waiting 1 second for stock update...");
        await sleep(1 * 1000);

        let freshEmbed = null;
        let changed = false;
        let lastDataString = JSON.stringify({
          seeds: rawData.Data.seeds,
          gear: rawData.Data.gear,
          egg: rawData.Data.egg,
        });
        const startTime = Date.now();

        while (!changed) {
          const stockUpdate = await updateStock();
          if (stockUpdate.updatedAt * 1000 <= lastUpdatedAt) {
            logger.info(`[Stock] No new stock timestamp yet, retrying...`);
            await sleep(1 * 1000);
            if (Date.now() - startTime > 30 * 1000) break;
            continue;
          }
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

          if (Date.now() - startTime > 30 * 1000) {
            logger.warn(
              `[Stock] No new update after 30s. Skipping this cycle.`
            );
            break;
          }
        }

        if (freshEmbed) {
          const pingRoles = await collectRolesToPing(rawData);
          const pingContent = pingRoles.length
            ? pingRoles.map((id) => `<@&${id}>`).join(" ")
            : null;

          for (const [
            guildId,
            { stockChannelId },
          ] of guildChannelsCache.entries()) {
            if (!guildId) continue;
            if (!stockChannelId) {
              logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
              continue;
            }
            await sendToChannel(
              stockChannelId,
              pingContent,
              freshEmbed,
              client
            );
          }

          logger.success(
            `[Stock] Sent new embed${
              pingRoles.length === 0
                ? "s without any role pings."
                : ` with role pings: ${pingRoles}`
            }`
          );
          await handleUserDMs(rawData, client);
        }
      }
    }

    async function startEventStockLoop() {
      await loadGuildChannelsCache();

      let {
        embed: firstEmbed,
        updateAt: firstUpdatedAt,
        rawData,
      } = await updateEventStock();

      let lastUpdatedAt = firstUpdatedAt;

      for (const [
        guildId,
        { eventChannelId },
      ] of guildChannelsCache.entries()) {
        if (!eventChannelId) {
          logger.warn(
            `[Stock] No event stock channel set for guild ${guildId}`
          );
          continue;
        }
        await sendToChannel(eventChannelId, null, firstEmbed, client);
      }

      logger.success(
        `[Event] Sent initial event embeds to all guild stock channels.`
      );

      while (true) {
        await waitUntilNextThirtyMinuteMark();

        logger.info("[Event] Waiting 1s for event stock update.");
        await sleep(1 * 1000);

        let freshStockEmbed = null;
        let changed = false;
        let lastDataString = JSON.stringify({
          eventshop: rawData.Data.eventshop,
        });
        const startTime = Date.now();

        while (!changed) {
          const eventStockUpdate = await updateEventStock();
          if (eventStockUpdate.updatedAt * 1000 <= lastUpdatedAt) {
            logger.info(
              `[Event] No new event stock time stamp yet, retrying..`
            );
            await sleep(5 * 1000);
            if (Date.now() - startTime > 30 * 1000) break;
            continue;
          }
          const newDataString = JSON.stringify({
            eventshop: eventStockUpdate.rawData.Data.eventshop,
          });

          if (newDataString !== lastDataString) {
            lastUpdatedAt = eventStockUpdate.updatedAt * 1000;
            lastDataString = newDataString;
            freshStockEmbed = eventStockUpdate.embed;
            rawData = eventStockUpdate.rawData;
            changed = true;
            logger.success(
              `[Event] New event stock detected at ${new Date(
                lastUpdatedAt
              ).toLocaleTimeString()}`
            );
          } else {
            logger.error(`[Event] No event update yet, re-trying in 1s.`);
            await sleep(1 * 1000);
          }

          if (Date.now() - startTime > 30 * 1000) {
            logger.warn(
              `[Event] No new event update after 30s, skipping this cycle.`
            );
            break;
          }
        }

        if (freshStockEmbed) {
          for (const [
            guildId,
            { eventstockChannelId },
          ] of guildChannelsCache.entries()) {
            if (!guildId) continue;
            if (!eventstockChannelId) {
              logger.warn(
                `[Stock] No event stock channel set for guild ${guildId}`
              );
              continue;
            }
            await sendToChannel(eventstockChannelId, null, firstEmbed, client);
          }
          logger.success(`
        [Event] Sent new embed.`);
        }
      }
    }

    async function startWeatherLoop() {
      await loadGuildChannelsCache();

      async function sendWeather() {
        const weather = await updateWeather();
        if (weather.embeds.length > 0) {
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
            await sendToChannel(weatherChannelId, null, weather.embeds, client);
          }
          logger.success(
            `[Weather] Sent weather embeds to all guild weather channels.`
          );
        } else {
          logger.info(`[Weather] No active weather found. Skipping send.`);
        }

        setTimeout(sendWeather, weather.weather[0].duration * 1000);
      }
      await sendWeather();
    }

    startWeatherLoop();
    startStockLoop();
    startEventStockLoop();

    setInterval(async () => {
      logger.info("[Cache] Refreshing guild channels cache...");
      await loadGuildChannelsCache();
    }, 5 * 60 * 1000);
  },
};
