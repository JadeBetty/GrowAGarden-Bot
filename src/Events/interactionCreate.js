const { logger } = require("console-wizard");
const fs = require("fs");
const path = require("path");
module.exports = {
  event: "interactionCreate",
  async run(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.slashcommands.get(interaction.commandName);
      if (!command)
        return interaction.reply("looks like this commmand can't be found");

      const configPath = path.join(process.cwd(), "config.json");
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch {
        const config2 = require("../../config.json");
        return command.run(client, interaction, config2 || null);
      }

      try {
        await command.run(client, interaction, config);
      } catch (e) {
        logger.error(e);
      }
    }
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      if (customId.startsWith("adduser-select")) {
        const command = client.slashcommands.get("adduser");
        if (!command?.select) return;
        const configPath = path.join(process.cwd(), "config.json");
        let config;
        try {
          config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        } catch {
          const config2 = require("../../config.json");
          return command.select(client, interaction, config2 || null);
        }
        try {
          await command.select(client, interaction, config);
        } catch (e) {
          logger.error(e);
        }
      }
    }

    if (interaction.isAutocomplete()) {
      const command = client.slashcommands.get(interaction.commandName);
      if (!command)
        return interaction.reply(
          "this fuck ass command isn't here, refresh your discord"
        );

      const configPath = path.join(process.cwd(), "config.json");
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch {
        const config2 = require("../../config.json");
        return command.autocomplete(client, interaction, config2 || null);
      }

      try {
        await command.autocomplete(client, interaction, config);
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
    }
  },
};
