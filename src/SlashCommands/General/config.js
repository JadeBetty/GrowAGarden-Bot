const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Edit the bot config.json choices array.")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new choice to config.json")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Display name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("Choice value")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("editname")
        .setDescription("Edit a choice's name by its value")
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("Choice value to edit")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("newname")
            .setDescription("New display name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a choice by its value")
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("Choice value to delete")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all choices in config.json")
    )
    .addSubcommand((sub) =>
      sub
        .setName("setuserdm")
        .setDescription("Enable or disable user DMs")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable user DMs?")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("setstockembed")
        .setDescription("Enable or disable stock embed")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable stock embeds?")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("addemoji")
        .setDescription("Add a new emoji to stock or weather.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Choose emoji type")
            .setRequired(true)
            .addChoices(
              { name: "Stock Emoji", value: "stock" },
              { name: "Weather Emoji", value: "weather" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name to add")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("The emoji to assign")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("editemoji")
        .setDescription("Edit an existing emoji.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Choose emoji type")
            .setRequired(true)
            .addChoices(
              { name: "Stock Emoji", value: "stock" },
              { name: "Weather Emoji", value: "weather" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The existing item to edit")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("The new emoji")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("deleteemoji")
        .setDescription("Delete an emoji from stock or weather.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Choose emoji type")
            .setRequired(true)
            .addChoices(
              { name: "Stock Emoji", value: "stock" },
              { name: "Weather Emoji", value: "weather" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name to delete")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("listemojis")
        .setDescription("List all stock or weather emojis.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Choose emoji type")
            .setRequired(true)
            .addChoices(
              { name: "Stock Emoji", value: "stock" },
              { name: "Weather Emoji", value: "weather" }
            )
        )
    ),

  async run(client, interaction) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      return interaction.reply({
        content: "❌ Failed to load config.json",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const ownerIds = Array.isArray(config.ownerId)
      ? config.ownerId
      : [config.ownerId];
    if (!ownerIds.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You are not authorized to use this command.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const name = interaction.options.getString("name");
      const value = interaction.options.getString("value");

      if (config.choices.some((choice) => choice.value === value)) {
        return interaction.reply({
          content: `⚠️ Value \`${value}\` already exists.`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      config.choices.push({ name, value });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return interaction.reply({
        content: `✅ Added choice: **${name}** (\`${value}\`)`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (subcommand === "editname") {
      const value = interaction.options.getString("value");
      const newName = interaction.options.getString("newname");

      const choice = config.choices.find((choice) => choice.value === value);
      if (!choice) {
        return interaction.reply({
          content: `❌ No choice found with value \`${value}\``,
          flags: [MessageFlags.Ephemeral],
        });
      }

      choice.name = newName;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return interaction.reply({
        content: `✅ Updated name for value \`${value}\` to **${newName}**`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (subcommand === "delete") {
      const value = interaction.options.getString("value");

      const index = config.choices.findIndex(
        (choice) => choice.value === value
      );
      if (index === -1) {
        return interaction.reply({
          content: `❌ No choice found with value \`${value}\``,
          flags: [MessageFlags.Ephemeral],
        });
      }

      const removed = config.choices.splice(index, 1)[0];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return interaction.reply({
        content: `🗑️ Deleted choice: **${removed.name}** (\`${removed.value}\`)`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (subcommand === "list") {
      if (!config.choices.length) {
        return interaction.reply({
          content: "⚠️ No choices found in config.json.",
          flags: [MessageFlags.Ephemeral],
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Config Choices")
        .setColor(0x7be551)
        .setDescription(
          config.choices.map((c) => `**${c.name}** — \`${c.value}\``).join("\n")
        );

      return interaction.reply({
        embeds: [embed],
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (subcommand === "setuserdm") {
      const enabled = interaction.options.getBoolean("enabled");
      if (typeof config.userdms !== "boolean") {
        config.userdms = false;
      }
      config.userdms = enabled;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return interaction.reply({
        content: `✅ User DMs have been **${
          enabled ? "enabled" : "disabled"
        }**.`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (subcommand === "setstockembed") {
      const enabled = interaction.options.getBoolean("enabled");
      if (typeof config.stockembed !== "boolean") {
        config.stockembed = false;
      }
      config.stockembed = enabled;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

      return interaction.reply({
        content: `✅ Stock embeds have been **${
          enabled ? "enabled" : "disabled"
        }**.`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (
      ["addemoji", "editemoji", "deleteemoji", "listemojis"].includes(
        subcommand
      )
    ) {
      const type = interaction.options.getString("type");
      const name = interaction.options.getString("name")?.toLowerCase();
      const emoji = interaction.options.getString("emoji");
      const target = config.emojis[type];

      if (!target) {
        return interaction.reply({
          content: `❌ Invalid type: ${type}`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (subcommand === "addemoji") {
        if (target[name]) {
          return interaction.reply({
            content: `⚠️ ${type} emoji **${name}** already exists. Use /config editemoji to modify it.`,
            flags: [MessageFlags.Ephemeral],
          });
        }
        target[name] = emoji;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
        return interaction.reply({
          content: `✅ Added ${type} emoji: **${name}** → ${emoji}`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (subcommand === "editemoji") {
        if (!target[name]) {
          return interaction.reply({
            content: `❌ ${type} emoji **${name}** does not exist.`,
            flags: [MessageFlags.Ephemeral],
          });
        }
        target[name] = emoji;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
        return interaction.reply({
          content: `✏️ Updated ${type} emoji: **${name}** → ${emoji}`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (subcommand === "deleteemoji") {
        if (!target[name]) {
          return interaction.reply({
            content: `❌ ${type} emoji **${name}** not found.`,
            flags: [MessageFlags.Ephemeral],
          });
        }
        delete target[name];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
        return interaction.reply({
          content: `🗑️ Deleted ${type} emoji: **${name}**`,
          flags: [MessageFlags.Ephemeral],
        });
      }

      if (subcommand === "listemojis") {
        const entries = Object.entries(target);
        if (!entries.length) {
          return interaction.reply({
            content: `⚠️ No ${type} emojis configured.`,
            flags: [MessageFlags.Ephemeral],
          });
        }
        const embed = new EmbedBuilder()
          .setTitle(`${type === "stock" ? "Stock" : "Weather"} Emojis`)
          .setColor(0x7be551)
          .setDescription(
            entries.map(([k, v]) => `**${k}** → ${v}`).join("\n")
          );
        return interaction.reply({
          embeds: [embed],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  },
  async autocomplete(client, interaction, config) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== "value") return interaction.respond([]);
    if (!config) return interaction.respond([]);

    const filtered = config.choices
      .filter((choice) =>
        choice.value.toLowerCase().includes(focusedOption.value.toLowerCase())
      )
      .slice(0, 25);

    const choices = filtered.map((choice) => ({
      name: choice.name,
      value: choice.value,
    }));

    await interaction.respond(choices);
  },
};

// thank you, chatgpt (i just got lazy.)
