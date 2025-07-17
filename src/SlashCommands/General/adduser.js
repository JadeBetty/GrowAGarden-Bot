const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../../config.json");
const { getEmoji } = require("../../functions");

function buildSelectMenu(category, items) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`adduser-select-${category}`)
    .setPlaceholder(`Select a ${category} item`)
    .setMinValues(1)
    .setMaxValues(items.length);

  for (const choice of items) {
    const emoji = getEmoji(choice.value);
    const paddedValue =
      choice.value.length >= 10
        ? choice.value
        : choice.value + "_".repeat(10 - choice.value.length);

    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(choice.name)
        .setValue(paddedValue)
        .setEmoji(emoji || undefined)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
  category: "General",
  data: new SlashCommandBuilder()
    .setName("adduser")
    .setDescription("Pick what item you want the bot to DM."),

  async run(client, interaction) {
    const grouped = {
      seed: [],
      gear: [],
      egg: [],
    };

    for (const choice of config.choices) {
      const [cat] = choice.value.split(".");
      if (grouped[cat]) grouped[cat].push(choice);
    }

    const rows = Object.entries(grouped)
      .filter(([, items]) => items.length > 0)
      .map(([cat, items]) => buildSelectMenu(cat, items));

    await interaction.reply({
      content: "Pick the items you want alerts for:",
      components: rows,
      flags: [MessageFlags.Ephemeral],
    });
  },
async select(client, interaction) {
  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  let guildData = await db.get(`guild_${guildId}`);
  if (!guildData) guildData = {};

  const addedItems = [];

  for (const rawValue of interaction.values) {
    const value = rawValue.replace(/_+$/, "");
    const [category, item] = value.split(".");
    if (!category || !item) continue;

    if (!guildData[category]) guildData[category] = {};
    if (!guildData[category][item]) {
      guildData[category][item] = {
        users: [],
        role: "",
      };
    }

    if (!guildData[category][item].users.includes(userId)) {
      guildData[category][item].users.push(userId);
      addedItems.push(
        config.choices.find((c) => c.value === value)?.name || `${category}.${item}`
      );
    }
  }

  await db.set(`guild_${guildId}`, guildData);

  await interaction.reply({
    content:
      addedItems.length > 0
        ? `✅ Added you to alerts for:\n• ${addedItems.join("\n• ")}`
        : "✅ You were already subscribed to all selected items.",
    flags: [MessageFlags.Ephemeral]
  });
}
};
