const { SlashCommandBuilder } = require("discord.js");

const { updateStock } = require("../../functions/getstock");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("stock")
    .setDescription("Check the Seed and Gear stock."),
  async run(client, interaction) {
    updateStock(client).then((items) => {
      interaction.reply({ embeds: [items.embed] });
    });
  },
};
