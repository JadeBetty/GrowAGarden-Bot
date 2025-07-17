const getstock = require("./getstock");
const getweather = require("./getweather");
const handleUserDMs = require("./handleUserDMs");
const helpers = require("./helpers");
const discordClient = require("./discordClient");
const geteventstock = require("./geteventstock");
const gettravellingmerchant = require("./gettravellingmerchant");
const startwebsocket = require("./startwebsocket");

module.exports = {
  ...getstock,
  ...getweather,
  ...helpers,
  ...discordClient,
  ...handleUserDMs,
  ...geteventstock,
  ...gettravellingmerchant,
  ...startwebsocket
};