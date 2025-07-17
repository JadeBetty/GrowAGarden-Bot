const { time, TimestampStyles, EmbedBuilder } = require("discord.js");

async function BuildEmbeds(type, stock) {
  if (type === "SGE") {
    const seeds =
      (stock.seeds || [])
        .map((item) => `**x${item.stock}** ${getEmoji(item.name)} ${item.name}`)
        .join("\n") || "None";

    const gear =
      (stock.gear || [])
        .map((item) => `**x${item.stock}** ${getEmoji(item.name)} ${item.name}`)
        .join("\n") || "None";

    const egg =
      (stock.egg || [])
        .map((item) => `**x${item.stock}** 🥚 ${item.name}`)
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
        { name: "🌱 Seed Stock", value: seeds },
        { name: "⚙️ Gear Stock", value: gear },
        { name: "🥚 Egg Stock", value: egg }
      )
      .setThumbnail(
        "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter"
      )
      .setFooter({
        text: "Grow A Garden",
        iconURL:
          "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter",
      })
      .setTimestamp();
  } else if (type === "MERCHANT") {
    const merchant =
      (stock.merchant || [])
        .map((item) => `**x${item.stock}** ${item.name}`)
        .join("\n") || "None";

    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`🛒 Traveling Merchant Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: merchant })
      .setThumbnail(
        "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter"
      )
      .setFooter({
        text: "Grow A Garden - Traveling Merchant",
        iconURL:
          "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter",
      })
      .setTimestamp();
  } else if (type === "COSMETIC") {
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
      .setThumbnail(
        "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter"
      )
      .setFooter({
        text: "Grow A Garden - Cosmetic Shop",
        iconURL:
          "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter",
      })
      .setTimestamp();
  } else if (type === "WEATHER") {
    return new EmbedBuilder()
      .setColor(0x7be551)
      .setTitle(`${getWeatherEmoji(stock.id)}  Weather Update - ${stock.name}`)
      .setDescription(`${stock.description}`)
      .setThumbnail(
        `${
          stock.icon ||
          "https://images-ext-1.discordapp.net/external/Rd1pMc1eVWWy6x9_pxPdANdaV4AA8y1b431OcJGImSQ/https/tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter?format=webp"
        }`
      )
      .setFooter({
        text: "Grow A Garden",
        iconURL:
          "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter",
      })
      .setTimestamp();
  } else if (type === "TMS") {
    const merchant =
      (stock.merchant || [])
        .map((item) => `**x${item.stock}** ${item.name}`)
        .join("\n") || "None";

    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`🛒 Traveling Merchant Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: merchant })
      .setThumbnail(
        "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter"
      )
      .setFooter({
        text: "Grow A Garden - Traveling Merchant",
        iconURL:
          "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter",
      })
      .setTimestamp();
  }
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
}

function getWeatherEmoji(name) {
  const lower = name.toLowerCase();
  if (lower.includes("rain")) return ":cloud_rain: ";
  if (lower.includes("thunderstorm")) return ":thunder_cloud_rain:";
  if (lower.includes("disco")) return "🕺";
  if (lower.includes("jandelstorm")) return "🐵:cloud_rain: ";
  if (lower.includes("blackhole")) return "⚫";
  if (lower.includes("djjhai")) return "🎉";
  if (lower.includes("nightevent")) return "🌙";
  if (lower.includes("meteorshower")) return "⭐🚿";
  if (lower.includes("sungod")) return "☀🐒";
  if (lower.includes("jandelfloat")) return "🐵";
  if (lower.includes("chocolaterain")) return "🍫:cloud_rain: ";
  if (lower.includes("volcano")) return "🌋";
  if (lower.includes("alieninvasion")) return "👽";
  if (lower.includes("spacetravel")) return "🚀";
  if (lower.includes("windy")) return "🍃";
  if (lower.includes("heatwave")) return "🥵";
  if (lower.includes("tornado")) return ":cloud_tornado:";
  return "❓";
}

module.exports = {
  BuildEmbeds,
  getEmoji
};
