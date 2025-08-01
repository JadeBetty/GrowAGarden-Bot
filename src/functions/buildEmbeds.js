const { time, TimestampStyles, EmbedBuilder } = require("discord.js");
const { url } = require("../../config.json");
async function BuildEmbeds(type, stock) {
  if (type === "SGE") {
    const seed =
      (stock.seed || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name)} ${item.name}`
        )
        .join("\n") || "None";

    const gear =
      (stock.gear || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name)} ${item.name}`
        )
        .join("\n") || "None";

    const egg =
      (stock.egg || [])
        .map(
          (item) =>
            `**x${item.stock}** ${getStockEmoji(item.name)} ${item.name}`
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
    return new EmbedBuilder()
      .setColor(0x7be551)
      .setTitle(`${getWeatherEmoji(stock.id)}  Weather Update - ${stock.name}`)
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
      .setThumbnail(
        url
      )
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
      .setTitle(`:man_in_lotus_position: Event Stock - ${formattedTime}`)
      .addFields({ name: "Available Items", value: event })
      .setThumbnail(
        url
      )
      .setFooter({
        text: "Grow A Garden - Event Stock",
        iconURL: url,
      })
      .setTimestamp();
  }

  if (type === "NOTIFICATION") {
    const updatedAtSeconds = Math.floor(Date.now() / 1000);
    const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);
    const description = Array.isArray(stock)
      ? stock
          .map(
            (item, index) =>
              `**Message ${index + 1}:** ${item.message || "None"}`
          )
          .join("\n")
      : stock.message || "Nothing...?";
    return new EmbedBuilder()
      .setColor(0x50c878)
      .setTitle(`:mega: Jandel Message - ${formattedTime}`)
      .setDescription(`${description}`)
      .setThumbnail(
        url
      )
      .setFooter({
        text: "Notification",
        iconURL: url,
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
} // only used for the slash command

function getStockEmoji(name) {
  const lower = name.toLowerCase();
  if (lower.includes("advanced sprinkler"))
    return "<:advanced_sprinkler:1395370033101799494>";
  if(lower.includes("elder strawberry")) return "<:elder_strawberry:1400819244400378019>";
  if (lower.includes("apple")) return "<:apple:1395370059664326656>";
  if (lower.includes("bamboo")) return "<:bamboo:1395370072503222354>";
  if (lower.includes("basic sprinkler"))
    return "<:basic_sprinkler:1395370082825404447>";
  if (lower.includes("beanstalk")) return "<:beanstalk:1395370094468792350>";
  if (lower.includes("blueberry")) return "<:blueberry:1395370104660688976>";
  if (lower.includes("burning bud"))
    return "<:burning_bud:1395370114366443661>";
  if (lower.includes("bug egg")) return "<:bug_egg:1395371376507879475>";
  if (lower.includes("carrot")) return "<:carrot:1395370144347459695>";
  if (lower.includes("cacao")) return "<:cacao:1395370125078827049>";
  if (lower.includes("cactus")) return "<:cactus:1395370134054637588>";
  if (lower.includes("cleaning spray"))
    return "<:cleaning_spray:1395370162240229406>";
  if (lower.includes("coconut")) return "<:coconut:1395370173468508351>";
  if (lower.includes("corn")) return "<:corn:1395370184784478218>";
  if (lower.includes("daffodil")) return "<:daffodil:1395370194267930715>";
  if (lower.includes("common egg")) return "<:common_egg:1395371385613844530>";
  if (lower.includes("common summer egg"))
    return "<:common_summer_egg:1395371395537567936>";
  if (lower.includes("dragon fruit"))
    return "<:dragon_fruit:1395370205408002189>";
  if (lower.includes("ember lily")) return "<:ember_lily:1395370219945594911>";
  if (lower.includes("favorite tool"))
    return "<:favorite_tool:1395370230783672485>";
  if (lower.includes("friendship pot"))
    return "<:friendship_pot:1395370244096131182>";
  if (lower.includes("giant pinecone"))
    return "<:giant_pinecone:1395370255483928668>";
  if (lower.includes("godly sprinkler"))
    return "<:godly_sprinkler:1395370264396697692>";
  if (lower.includes("grape")) return "<:grape:1395370272810467418>";
  if (lower.includes("harvest tool"))
    return "<:harvest_tool:1395370296210358412>";
  if (lower.includes("levelup lollipop"))
    return "<:levelup_lollipop:1395370322030624830>";
  if (lower.includes("legendary egg"))
    return "<:legendary_egg:1395371407264845834>:";
  if (lower.includes("magnifying glass"))
    return "<:magnifying_glass:1395370335582556170>";
  if (lower.includes("mango")) return "<:mango:1395370348035313807>";
  if (lower.includes("master sprinkler"))
    return "<:master_sprinkler:1395370359393620052>";
  if (lower.includes("medium toy")) return "<:medium_toy:1395370372819583127>";
  if (lower.includes("medium treat"))
    return "<:medium_treat:1395370391723311235>";
  if (lower.includes("mushroom")) return "<:mushroom:1395370406189338674>";
  if (lower.includes("mythical egg"))
    return "<:mythical_egg:1395371424633458728>";
  if (lower.includes("paradise egg"))
    return "<:paradise_egg:1395371436524175382>";
  if (lower.includes("pepper")) return "<:pepper:1395370435528360036>";
  if (lower.includes("pumpkin")) return "<:pumpkin:1395370446840660048>";
  if (lower.includes("rare egg")) return "<:rare_egg:1395371448486461520>";
  if (lower.includes("rare summer egg"))
    return "<:rare_summer_egg:1395371460163534889>";
  if (lower.includes("recall wrench"))
    return "<:recall_wrench:1395370466558083093>";
  if (lower.includes("strawberry")) return "<:strawberry:1395370496794558694>";
  if (lower.includes("sugar apple"))
    return "<:sugar_apple:1395370532072980570>";
  if (lower.includes("tanning mirror"))
    return "<:tanning_mirror:1395370546577018932>";
  if (lower.includes("tomato")) return "<:tomato:1395370569977041078>";
  if (lower.includes("trowel")) return "<:trowel:1395370587760627762>";
  if (lower.includes("orange tulip"))
    return "<:orange_tulip:1395370419237818510>";
  if (lower.includes("watering can"))
    return "<:watering_can:1395370603409576026>";
  if (lower.includes("watermelon")) return "<:watermelon:1395370616282026085>";
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
  if (lower.includes("frost")) return ":snowflake:";
  if (lower.includes("zen")) return ":man_in_lotus_position: ";
  return "❓";
}

module.exports = {
  BuildEmbeds,
  getEmoji,
};
