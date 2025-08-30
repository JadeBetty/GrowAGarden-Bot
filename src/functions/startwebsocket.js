const WebSocket = require("ws");
const { logger } = require("console-wizard");
const { clientId, key } = require("../../config.json");
const { handleUpdate } = require("./handleUpdate");
const {
  sendToChannel,
  loadGuildChannelsCache,
  guildChannelsCache,
} = require("./discordClient.js");
const { handleUserDMs } = require("./handleUserDMs.js");
const { canSendPing, getClient, sleep } = require("./helpers.js");

function startWebsocket() {
  const client = getClient();
  const ws = new WebSocket(
    `wss://websocket.joshlei.com/growagarden?user_id=${encodeURIComponent(
      clientId
    )}`,
    {
      headers: {
        "jstudio-key": key,
      },
    }
  );

  ws.on("open", () => {
    logger.success("[Websocket] Websocket connected successfully");
  });

  ws.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const Data = await handleUpdate(parsed);
      if (!Data || !Data.type)
        return logger.warn("[Stock] Data returned null.");

      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch (err) {
        logger.error("[Config] Failed to load config.json, using defaults");
        config = {};
      }

      if (Data.type === "SGE") {
        logger.info("[Stock] Detected new stock.");
        await loadGuildChannelsCache();

        if (config.stockembed === false) {
          logger.warn("[Stock] Stock embeds are disabled in config.json");
        } else {
          for (const [
            guildId,
            { stockChannelId },
          ] of guildChannelsCache.entries()) {
            if (!stockChannelId) {
              logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
              continue;
            }

            const rolesToPing = [];
            for (const target of Data.alert.roleTargets) {
              if (target.guildId !== guildId) continue;
              const category = target.item.split(".")[0];
              if (await canSendPing(guildId, target.roleId, category)) {
                rolesToPing.push(`<@&${target.roleId}>`);
              }
            }

            const pingContent = rolesToPing.length
              ? rolesToPing.join(" ")
              : null;
            await sendToChannel(
              stockChannelId,
              pingContent,
              Data.embed,
              client
            );
            logger.success(
              `[Stock] Sent stock embed & pings for guild ${guildId}`
            );
          }
        }

        if (config.userdms !== false) {
          await handleUserDMs(Data, client);
        } else {
          logger.warn("[UserDM] User DMs are disabled in config.json");
        }
      }

      if (Data.type === "weather") {
        if (Data.activeWeather.length === 0) {
          return logger.warn("[Weather] Seems like no weather is found");
        }
        await loadGuildChannelsCache();
        sleep(100);
        for (const [
          guildId,
          { weatherChannelId },
        ] of guildChannelsCache.entries()) {
          if (!weatherChannelId) {
            logger.warn(`[Weather] No weather channel for guild ${guildId}`);
            continue;
          }
          await sendToChannel(weatherChannelId, null, Data.embed, client);
        }
      }

      if (Data.type === "TMS") {
        loadGuildChannelsCache();
        for (const [
          guildId,
          { eventChannelId },
        ] of guildChannelsCache.entries()) {
          if (!eventChannelId) {
            logger.warn(
              `[Stock] No traveling merchant stock channel set for guild ${guildId}`
            );
            continue;
          }
          await sendToChannel(eventChannelId, null, Data.embed, client);
          console.log("Successfully sent traveling merchant stock.");
        }
      }

      if (Data.type === "EVENT") {
        loadGuildChannelsCache();
        sleep(100);
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
          await sendToChannel(eventChannelId, null, Data.embed, client);
        }
      }

      if (Data.type === "NOTIFICATION") {
        loadGuildChannelsCache();
        sleep(100);
        for (const [
          guildId,
          { eventChannelId },
        ] of guildChannelsCache.entries()) {
          if (!eventChannelId) {
            logger.warn(
              `[Stock] No NOTIFICATION channel set for guild ${guildId}`
            );
            continue;
          }
          await sendToChannel(eventChannelId, null, Data.embed, client);
        }
      }
    } catch (err) {
      console.log(err);
      logger.error("[Websocket] Failed to handle update.");
    }
  });

  ws.on("error", (err) => {
    console.log(err);
    logger.error("[Websocket] Websocket error.");
  });

  ws.on("close", () => {
    logger.warn("[Websocket] Websocket closed, Reconnecting in 5s..");
    setTimeout(() => startWebsocket(), 5000);
  });
}

module.exports = {
  startWebsocket,
};
