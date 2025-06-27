const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Set the channels for stock and weather updates.")
    .addChannelOption(option =>
      option
        .setName("stock")
        .setDescription("Channel for stock updates")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addChannelOption(option =>
      option
        .setName("weather")
        .setDescription("Channel for weather updates")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(__, interaction) {
    const stockChannel = interaction.options.getChannel("stock");
    const weatherChannel = interaction.options.getChannel("weather");

    const guildId = interaction.guildId;
    let guildData = await db.get(`guild_${guildId}`) || {};

    guildData.channels = {
      stock: stockChannel.id,
      weather: weatherChannel.id
    };

    await db.set(`guild_${guildId}`, guildData);

    await interaction.reply({
      content: `✅ Channels set:\n📦 Stock: <#${stockChannel.id}>\n🌦️ Weather: <#${weatherChannel.id}>`,
      ephemeral: true
    });
  }
};
