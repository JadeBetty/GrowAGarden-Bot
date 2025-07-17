const WebSocket = require("ws");
const { logger } = require("console-wizard");
const { handleUpdate } = require("./handleUpdate");

const { clientId } = require("../../config.json");
const {
  sendToChannel,
  loadGuildChannelsCache,
  guildChannelsCache,
} = require("./discordClient.js");

const { handleUserDMs } = require("./handleUserDMs.js");

function startWebsocket(client) {
  const ws = new WebSocket(
    `wss://websocket.joshlei.com/growagarden?user_id=${encodeURIComponent(
      clientId
    )}`
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

      if (Data.type === "SGE") {
        logger.info("[Stock] Detected new stock.");
        const pingRoles = Data.alert.roleTargets.map((r) => `<@&${r.roleId}>`);
        const pingContent = pingRoles.length ? pingRoles.join(" ") : null;
        await loadGuildChannelsCache();
        for (const [
          guildId,
          { stockChannelId },
        ] of guildChannelsCache.entries()) {
          if (!stockChannelId) {
            logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
            continue;
          }
          await sendToChannel(stockChannelId, pingContent, Data.embed, client);
          await handleUserDMs(Data, client);
          logger.success("[Stock] Sucessfully sent stock embed.");
        }
      } else if (Data.type === "weather") {
        if (Data.activeWeather.length === 0)
          return logger.warn("[Weather] Seems like no weather is found");
        await loadGuildChannelsCache();
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
      } else if (Data.type === "TMS") {
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
    logger.warn("[Websocket] Websocket clsoed, Reconnecting in 5s..");
    setTimeout(() => startWebsocket(), 5000);
  });
}

module.exports = {
  startWebsocket,
};
