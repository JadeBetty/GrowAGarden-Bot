const { time, TimestampStyles, EmbedBuilder } = require("discord.js");
const { url } = require("../../config.json");
const logger = require("console-wizard");
const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "config.json");

let lastMessages = [];
async function BuildEmbeds(type, stock) {
  if (type === "SGE") {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      logger.error("[Config] Failed to load config.json, using defaults");
      config = {};
    }

    const seed =
      (stock.seed || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name, config)} ${
              item.name
            }`
        )
        .join("\n") || "None";

    const gear =
      (stock.gear || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name, config)} ${
              item.name
            }`
        )
        .join("\n") || "None";

    const egg =
      (stock.egg || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name, config)} ${
              item.name
            }`
        )
        .join("\n") || "None";

    const updatedAtDate = new Date(stock.updatedAt * 1000);
    const msPer5Min = 1000 * 60 * 5;
    const roundedDate = new Date(
      Math.floor(updatedAtDate.getTime() / msPer5Min) * msPer5Min
    );
    const updatedAtSeconds = Math.floor(roundedDate.getTime() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0x7be551)
      .setTitle(`Grow a Garden Stock - ${formattedTime}`)
      .addFields(
        { name: "🌱 Seed Stock", value: seed },
        { name: "⚙️ Gear Stock", value: gear },
        { name: "🥚 Egg Stock", value: egg }
      )
      .setThumbnail(url)
      .setFooter({
        text: "Grow A Garden",
        iconURL: url,
      })
      .setTimestamp();
  }
  if (type === "COSMETIC") {
    const cosmetics =
      (stock.cosmetics || [])
        .map((item) => `**x${item.stock}** ${item.name}`)
        .join("\n") || "None";

    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0xffb347)
      .setTitle(`🎁 Cosmetic Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: cosmetics })
      .setThumbnail(url)
      .setFooter({
        text: "Grow A Garden - Cosmetic Shop",
        iconURL: url,
      })
      .setTimestamp();
  }
  if (type === "WEATHER") {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      logger.error("[Config] Failed to load config.json, using defaults");
      config = {};
    }
    return new EmbedBuilder()
      .setColor(0x7be551)
      .setTitle(
        `${getWeatherEmoji(stock.id, config)}  Weather Update - ${stock.name}`
      )
      .setDescription(`${stock.description || "No description."}`)
      .setThumbnail(
        `${
          stock.icon ||
          "https://images-ext-1.discordapp.net/external/Rd1pMc1eVWWy6x9_pxPdANdaV4AA8y1b431OcJGImSQ/https/tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter?format=webp"
        }`
      )
      .setFooter({
        text: "Grow A Garden",
        iconURL: url,
      })
      .setTimestamp();
  }
  if (type === "TMS") {
    const merchant =
      (stock.stock || [])
        .map((item) => `**x${item.stock}** ${item.name}`)
        .join("\n") || "None";

    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`🛒 ${stock.merchantName} Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: merchant })
      .setThumbnail(url)
      .setFooter({
        text: "Grow A Garden - Traveling Merchant",
        iconURL: url,
      })
      .setTimestamp();
  }
  if (type === "EVENT") {
    const event =
      (stock.stock || [])
        .map((item) => `**x${item.stock}** ${item.name}`)
        .join("\n") || "None";

    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`Event Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: event })
      .setThumbnail(url)
      .setFooter({
        text: "Grow A Garden - Event Stock",
        iconURL: url,
      })
      .setTimestamp();
  }

  if (type === "NOTIFICATION") {
    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);
    let newMessages = [];
    if (Array.isArray(stock)) {
      const seenThisBatch = new Set();
      const uniqueThisBatch = stock.filter((item) => {
        const msg = item.message || "None";
        if (seenThisBatch.has(msg)) return false;
        seenThisBatch.add(msg);
        return true;
      });
      newMessages = uniqueThisBatch
        .map((item) => item.message || "None")
        .filter((msg) => !lastMessages.includes(msg));

      lastMessages = [...lastMessages, ...newMessages];
      if (lastMessages.length > 50) lastMessages = lastMessages.slice(-50);
    }

    let description =
      Array.isArray(newMessages) && newMessages.length
        ? newMessages
            .map((msg, index) => `**Message ${index + 1}:** ${msg}`)
            .join("\n")
        : stock.message || "Nothing...?";

    if (description.length > 4096) {
      description = description.slice(0, 4093) + "...";
    }

    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`:mega: Jandel Message - ${formattedTime}`)
      .setDescription(description || "Nothing new.")
      .setThumbnail(url)
      .setFooter({
        text: "Notification",
        iconURL: url,
      })
      .setTimestamp();
  }
}

function getStockEmoji(name, config) {
  const lower = name.toLowerCase();
  for (const key in config.emojis.stock) {
    if (lower.includes(key)) {
      return config.emojis.stock[key];
    }
  }
  return "❓";
}

function getWeatherEmoji(name, config) {
  const lower = name.toLowerCase();
  for (const key in config.emojis.weather) {
    if (lower.includes(key)) {
      return config.emojis.weather[key];
    }
  }
  return "❓";
}


function getEmoji(name) {
  const lower = name.toLowerCase();
  if (lower.includes("blueberry")) return "🫐";
  if (lower.includes("carrot")) return "🥕";
  if (lower.includes("strawberry")) return "🍓";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("tulip")) return "🌷";
  if (lower.includes("corn")) return "🌽";
  if (lower.includes("daffodil")) return "🌼";
  if (lower.includes("watermelon")) return "🍉";
  if (lower.includes("pumpkin")) return "🎃";
  if (lower.includes("green apple")) return "🍏";
  if (lower.includes("apple")) return "🍎";
  if (lower.includes("spray")) return "🧴";
  if (lower.includes("bamboo")) return "🎍";
  if (lower.includes("coconut")) return "🥥";
  if (lower.includes("dragon")) return "🐲";
  if (lower.includes("mango")) return "🥭";
  if (lower.includes("grape")) return "🍇";
  if (lower.includes("mushroom")) return "🍄";
  if (lower.includes("pepper")) return "🌶";
  if (lower.includes("ember")) return "💐";
  if (lower.includes("sugar")) return "🍏";
  if (lower.includes("trowel")) return "❓";
  if (lower.includes("favorite")) return "💖";
  if (lower.includes("watering")) return "💧";
  if (lower.includes("wrench")) return "🔧";
  if (lower.includes("harvest")) return "🌾";
  if (lower.includes("tanning")) return "🕶";
  if (lower.includes("avocado")) return "🥑";
  if (lower.includes("banana")) return "🍌";
  if (lower.includes("cauliflower")) return "🥦";
  if (lower.includes("loquat")) return "🍊";
  if (lower.includes("magnifying glass")) return "🔍";
  if (lower.includes("kiwi")) return "🥝";
  if (lower.includes("pear")) return "🍐";
  if (lower.includes("bell pepper")) return ":bell_pepper:";
  return "❓";
} // only used for the slash command

module.exports = {
  BuildEmbeds,
  getEmoji,
};
