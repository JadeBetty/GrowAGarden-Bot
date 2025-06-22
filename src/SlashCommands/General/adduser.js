const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../../config.json");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("adduser")
    .setDescription("Pick what item you want the bot to DM.")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async run(__, interaction) {
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
    if (!guildData[category]) guildData[category] = {};
    if (!guildData[category][item]) {
      guildData[category][item] = {
        users: [],
        role: "",
      };
    }

    if (!guildData[category][item].users.includes(interaction.user.id)) {
      guildData[category][item].users.push(interaction.user.id);
    }
    await db.set(`guild_${guildid}`, guildData);
    const pretty =
      config.choices.find((choice) => choice.value === input)?.name ||
      `${category}.${item}`;
    interaction.reply({
      content: `✅ Added you to alerts for **${pretty}**`,
      flags: [MessageFlags.Ephemeral],
    });
  },

  async autocomplete(client, interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = config.choices.filter((choice) =>
      choice.name.toLowerCase().startsWith(focusedValue.toLowerCase())
    );
    await interaction.respond(filtered);
  },
};
