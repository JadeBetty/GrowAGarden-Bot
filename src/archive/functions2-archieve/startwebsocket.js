const WebSocket = require("ws");
const { logger } = require("console-wizard");
const { handleStockUpdate } = require("./handlestockcat");
const {
  loadGuildChannelsCache,
  sendToChannel,
  guildChannelsCache,
} = require("./discordClient");

const user_id = "758617912566087681";

function startWebsocket() {
  const ws = new WebSocket(
    `wss://websocket.joshlei.com/growagarden?user_id=${encodeURIComponent(
      user_id
    )}`
  );

  ws.on("open", () => {
    logger.success("[WS] WebSocket connected successfully.");
  });

  ws.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (!parsed || typeof parsed !== "object") return;

      handleStockUpdate(parsed, async ({ embed, alert, data }) => {
        const pingRoles = alert.roleTargets.map((r) => `<@&${r.roleId}>`);
        const pingContent = pingRoles.length ? pingRoles.join(" ") : null;
        await loadGuildChannelsCache();

        console.log(embed);
        console.log(alert);
        console.log(data);
        for (const [
          guildId,
          { stockChannelId },
        ] of guildChannelsCache.entries()) {
          if (!stockChannelId) {
            logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
            continue;
          }
          await sendToChannel(stockChannelId, pingContent, embed, client);
        }

        //         if(data.)
        //          const pingRoles = alert.roleTargets.map((r) => `<@&${r.roleId}>`);
        // //       const pingContent = pingRoles.length ? pingRoles.join(" ") : null;

        // //       for (const [
        // //         guildId,
        // //         { stockChannelId },
        // //       ] of guildChannelsCache.entries()) {
        // //         if (!stockChannelId) {
        // //           logger.warn(`[Stock] No stock channel set for guild ${guildId}`);
        // //           continue;
        // //         }
        // //         await sendToChannel(sto3ckChannelId, pingContent, embed, client);
        // //       }
      });
    } catch (err) {
      logger.error("[WS] Failed to handle WS stock update:", err);
    }
  });

  ws.on("error", (err) => {
    logger.error("[WS] WebSocket error:", err);
  });

  ws.on("close", () => {
    logger.warn("[WS] WebSocket closed. Reconnecting in 5s...");
    setTimeout(() => startWebsocket(), 5000);
  });
}

module.exports = {
  startWebsocket,
};
