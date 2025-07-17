const startwebsocket = require("./startwebsocket.js");
const getweatherinfo = require("./getWeatherInfo.js");
const discordClient = require("./discordClient.js");
const buildEmbeds = require("./buildEmbeds.js");
const helpers = require("./helpers.js");


module.exports = {
    ...startwebsocket,
    ...getweatherinfo,
    ...buildEmbeds,
    ...discordClient,
    ...helpers
}