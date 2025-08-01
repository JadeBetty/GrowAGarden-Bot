const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../../config.json");

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("setrole")
    .setDescription("Set a role to be pinged when an item is in stock.")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Role to mention when the item is in stock")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The category type")
        .setRequired(true)
        .addChoices(
          { name: "Seed", value: "seed" },
          { name: "Gear", value: "gear" },
          { name: "Egg", value: "egg" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(__, interaction) {
    const role = interaction.options.getRole("role");
    const type = interaction.options.getString("type");
    const item = interaction.options.getString("item");

    const input = `${type}.${item}`;

    const guildid = interaction.guildId;
    let guildData = await db.get(`guild_${guildid}`);
    if (!guildData) guildData = {};

    if (!guildData[type]) guildData[type] = {};
    if (!guildData[type][item]) {
      guildData[type][item] = { users: [], role: "" };
    }
    guildData[type][item].role = role.id;

    await db.set(`guild_${guildid}`, guildData);

    const pretty =
      config.choices.find((choice) => choice.value === input)?.name || input;

    interaction.reply({
      content: `✅ Set <@&${role.id}> as the role to mention for **${pretty}**`,
      flags: [MessageFlags.Ephemeral],
    });
  },

  async autocomplete(__, interaction) {
    const focusedValue = interaction.options.getFocused();
    const type = interaction.options.getString("type");

    const filtered = config.choices
      .filter((choice) => choice.value.startsWith(`${type}.`))
      .filter((choice) =>
        choice.name.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .map((choice) => ({
        name: choice.name,
        value: choice.value.split(".")[1],
      }));

    await interaction.respond(filtered.slice(0, 25));
  },
};
