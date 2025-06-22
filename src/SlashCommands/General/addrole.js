const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../../config.json");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("setrole")
    .setDescription("Set a role to be pinged when an item is in stock.")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Role to mention when the item is in stock")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("The item")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(__, interaction) {
    const role = interaction.options.getRole("role");
    const input = interaction.options.getString("item").toLowerCase();
    const [category, item] = input.split(".");

    if (!category || !item) {
      return interaction.reply({
        content: "❌ Invalid format. Use the provided choices.",
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

    guildData[category][item].role = role.id;
    await db.set(`guild_${guildid}`, guildData);
    const pretty =
      config.choices.find((choice) => choice.value === input)?.name ||
      `${category}.${item}`;

    interaction.reply({
      content: `✅ Set <@&${role.id}> as the role to mention for **${pretty}**`,
      flags: [MessageFlags.Ephemeral],
    });
  },

  async autocomplete(__, interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = config.choices.filter((choice) =>
      choice.name.toLowerCase().startsWith(focusedValue.toLowerCase())
    );
    await interaction.respond(filtered);
  },
};
