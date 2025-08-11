const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Shows bot information"),
  async run(client, interaction) {
    const { default: prettyMs } = await import("pretty-ms");
    let members = 0;
    client.guilds.cache.forEach(
      (g) => (members += g.members.cache.filter((g) => !g.bot).size)
    );
    const clientUptime = prettyMs(client.uptime);
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${client.user.username}'s Info`)
          .addFields(
            {
              name: `Servers`,
              value: `${client.guilds.cache.size}`,
              inline: true,
            },
            { name: `Users`, value: `${members}`, inline: true },
            { name: `Ping`, value: `${client.ws.ping}`, inline: true },
            { name: `Uptime`, value: `${clientUptime}`, inline: true }
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setColor("#a8f1b0")
          .setTimestamp(),
      ],
      flags: [MessageFlags.Ephemeral],
    });
  },
};
