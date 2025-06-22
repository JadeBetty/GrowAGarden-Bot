const {
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

const wait = require('node:timers/promises').setTimeout;

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("message")
    .setDescription("global message the server")
    .addStringOption((option) =>
      option.setName("input").setDescription("the input for a message").setRequired(true)
    ),
  async run(client, interaction) {
    if(interaction.user.id !== "758617912566087681") return;
    const message = interaction.options.getString("input");
    await interaction.reply({ content: "sending...", flags: [MessageFlags.Ephemeral]});
    await wait(1_000);
    interaction.channel.send(message);
  },
};
