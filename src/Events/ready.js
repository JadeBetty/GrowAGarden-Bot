const Discord = require("discord.js");
const { logger } = require("console-wizard");
const { startWebsocket, setClient } = require("../functions")


module.exports = {
    event: "ready",
    async run(client) {
        logger.success(`[Event] Logged in as ${client.user.tag}`);
        client.user.setActivity("Stocks", {
            type: Discord.ActivityType.Watching
        });
        setClient(client);
        startWebsocket();
    }
}