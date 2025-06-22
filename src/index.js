require("dotenv").config();

const fs = require("fs");
const { REST, Client, Collection, Routes } = require("discord.js");
const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildMembers"],
});
const path = require("path");
const { logger } = require("console-wizard");
const { clientId } = require("../config.json");
const slashcommands = [];
const events = [];
client.slashcommands = new Collection();
client.commands = new Collection();

fs.readdirSync(`./src/SlashCommands`).forEach((subfolder) => {
  const slashcommandsFiles = fs
    .readdirSync(`./src/SlashCommands/${subfolder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of slashcommandsFiles) {
    const slash = require(`./SlashCommands/${subfolder}/${file}`);
    client.slashcommands.set(slash.data.name, slash);
    slashcommands.push(slash.data.toJSON());
  }
});

fs.readdir("./src/Events", (err, files) => {
  if (err) return console.error(err);

  const eventFiles = files.filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const eventPath = path.join(__dirname, "Events", file);
    const event = require(eventPath);
    events.push(event);
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    logger.info(`Registering ${event.event}`);
    if (!event?.event || !event?.run) {
      logger.error(
        `${event?.event ?? "Unknown"} is missing an event name or run.`
      );
      continue;
    }

    client.on(event.event, (...args) => event.run(...args, client));
  }
});

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.token);

  try {
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: slashcommands,
    });

    client.slashId = new Map(data.map((e) => [e.name, e.id]));
  } catch (e) {
    logger.error(`${e}`);
  }
}

registerCommands();

module.exports = { client };

client.login(process.env.token);
