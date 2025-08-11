const { logger } = require("console-wizard");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
module.exports = {
  event: "guildCreate",
  async run(guild, client) {
    logger.info(`[Guilds] Added to guild ${guild.name} (${guild.id})`);
    const exists = await db.get(`guild_${guild.id}`);
    if (!exists) {
      await db.set(`guild_${guild.id}`, { channels: {} });
      logger.success(`[Guilds] Created DB entry for guild ${guild.name} (${guild.id})`);
      const owner = await client.users.fetch(guild?.ownerId).catch(() => null);
      if(!owner) return logger.error(`[Guilds] ${guild.name} (${guild.id})'s owner (${guild.ownerId}) not found. `);
      owner.send(`# :sparkles: Stock notifier, in your own server.

## :package:  Setting up
- /channel [stock]  [weather]  [events]
-# events includes traveling merchant, jandel messages and obviously, the event stock if there's any,

## :bell: Add & Remove roles
- /setrole [role]  [type]  [item]
- /removerole [item] 

## Add & Remove automatic messaging
- /adduser 
- /removeuser [item]

## Support Server --> <https://discord.gg/BPxuWuYZ>
## Source code  --> <https://github.com/JadeBetty/GrowAGarden-bot> 
-# star it plz 

### Bot isn't actively maintained, bugs may be expected report them in the support server or add updates to the bot on the Github page.

### Thanks for inviting me into your server :D -- <@758617912566087681>`)
    } else {
      logger.warn(
        `[Guilds] DB entry already exists for guild ${guild.name} (${guild.id})`
      );
    }
  },
};
