const { logger } = require("console-wizard");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
module.exports = {
  event: "guildDelete",
  async run(guild, client) {
    logger.info(`[Guilds] Removed to guild ${guild.name} (${guild.id})`);
    await db.delete(`guild_${guild.id}`);
    logger.success(
      `[Guilds] Succesfully removed DB entry for guild ${guild.name} (${guild.id})`
    );
  },
};
