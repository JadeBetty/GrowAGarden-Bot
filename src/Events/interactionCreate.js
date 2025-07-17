const { logger } = require("console-wizard");
module.exports = {
  event: "interactionCreate",
  async run(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.slashcommands.get(interaction.commandName);
      if (!command)
        return interaction.reply("looks like this commmand can't be found");

      try {
        await command.run(client, interaction);
      } catch (e) {
        logger.error(e);
      }
    }
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      if (customId.startsWith("adduser-select")) {
        const command = client.slashcommands.get("adduser");
        if (!command?.select) return;
        try {
          await command.select(client, interaction);
        } catch (e) {
          logger.error(e);
        }
      } else if (customId.startsWith("setrole-select")) {
        const command = client.slashcommands.get("setrole");
        if (!command?.select) return;
        try {
          await command.select(client, interaction);
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

      try {
        await command.autocomplete(client, interaction);
      } catch (e) {
        console.log(e);
        logger.error(e);
      }
    }
  },
};
