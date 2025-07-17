const guildChannelsCache = new Map();
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { logger } = require("console-wizard");

async function loadGuildChannelsCache() {
  const allGuilds = await db.all();
  guildChannelsCache.clear();
  for (const entry of allGuilds) {
    if (!entry.id.startsWith("guild_")) continue;
    const guildId = entry.id.split("_")[1];
    const guildData = entry.value || {};
    const stockChannelId = guildData.channels?.stock || null;
    const weatherChannelId = guildData.channels?.weather || null;
    const eventChannelId = guildData.channels?.event || null;

    guildChannelsCache.set(guildId, { stockChannelId, weatherChannelId, eventChannelId });
  }
  logger.info(
    `[Cache] Loaded guild channels cache: ${guildChannelsCache.size} guilds.`
  );
}

async function sendToChannel(channelId, content, embeds, client) {
  if (!channelId) return false;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return false;
    await channel.send({
      content,
      embeds: embeds ? (Array.isArray(embeds) ? embeds : [embeds]) : undefined,
    });

    return true;
  } catch (error) {
    console.log(error)
    logger.warn(
      `Failed to send message to channel ${channelId}: ${error.message}`
    );
    return false;
  }
}

module.exports = {
    sendToChannel,
    loadGuildChannelsCache,
    guildChannelsCache
};