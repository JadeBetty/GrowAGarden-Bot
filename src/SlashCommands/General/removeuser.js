const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../../config.json");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("removeuser")
    .setDescription("Remove yourself from alerts for a specific item.")
    .setContexts(0)
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async run(__, interaction, config) {
    const input = interaction.options.getString("item").toLowerCase();
    const [category, item] = input.split(".");

    if (!category || !item) {
      return interaction.reply({
        content: "❌ Invalid format. Use the proper autocomplete choice.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const guildid = interaction.guildId;
    let guildData = await db.get(`guild_${guildid}`);
    if (!guildData) guildData = {};

    if (
      !guildData[category] ||
      !guildData[category][item] ||
      !guildData[category][item].users
    ) {
      return interaction.reply({
        content: `❌ You are not subscribed to alerts for **${input}**`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    const userIndex = guildData[category][item].users.indexOf(
      interaction.user.id
    );
    if (userIndex === -1) {
      return interaction.reply({
        content: `❌ You are not subscribed to alerts for **${input}**`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    guildData[category][item].users.splice(userIndex, 1);

    await db.set(`guild_${guildid}`, guildData);

    const pretty =
      config.choices.find((choice) => choice.value === input)?.name ||
      `${category}.${item}`;

    return interaction.reply({
      content: `✅ Removed you from alerts for **${pretty}**`,
      flags: [MessageFlags.Ephemeral],
    });
  },

  async autocomplete(__, interaction, config) {
    if (!config) return interaction.respond([]);
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = config.choices
      .filter((choice) => choice.name.toLowerCase().includes(focusedValue))
      .slice(0, 25);
    const response = filtered.map((choice) => ({
      name: choice.name,
      value: choice.value,
    }));
    await interaction.respond(response);
  },
};
