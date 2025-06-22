const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const https = require("https");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

function createOptions(path) {
  return {
    method: "GET",
    hostname: "growagardenstock.com",
    path: path,
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      referer: "https://growagardenstock.com/api/stock",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/119.0.0.0",
    },
  };
}

function fetchStockData(path) {
  return new Promise((resolve, reject) => {
    const options = createOptions(path);
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error("Failed to parse JSON: " + e.message));
        }
      });
    });
    req.on("error", (e) => reject(e));
    req.end();
  });
}

function extractCounts(items) {
  return items.map((item) => {
    const match = item.match(/\*\*x(\d+)\*\*/);
    const stock = match ? match[1] : "0";
    const name = item.replace(/\s*\*\*x\d+\*\*$/, "").trim();
    return { name, stock };
  });
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
  if (lower.includes("apple")) return "🍎";
  if (lower.includes("spray")) return "🧴";
  if (lower.includes("bamboo")) return "🎍";
  if (lower.includes("coconut")) return "🥥";
  if (lower.includes("dragon")) return "🐲";
  if (lower.includes("mango")) return "🥭";
  if (lower.includes("grape")) return "🍇";
  if (lower.includes("mushroom")) return "🍄";
  if (lower.includes("pepper")) return "🌶";
  if (lower.includes("cacao")) return "❓";
  if (lower.includes("beanstalk")) return "❓";
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
  return "❓";
}

function buildStockEmbed(stock) {
  const seeds =
    (stock.Data.seeds || [])
      .map((item) => `**x${item.stock}** ${getEmoji(item.name)} ${item.name}`)
      .join("\n") || "None";

  const gear =
    (stock.Data.gear || [])
      .map((item) => `**x${item.stock}** ${getEmoji(item.name)} ${item.name}`)
      .join("\n") || "None";

  const egg =
    (stock.Data.egg || [])
      .map((item) => `**x${item.stock}** 🥚 ${item.name}`)
      .join("\n") || "None";

  const updatedAtDate = new Date(stock.Data.updatedAt);
  const msPer5Min = 1000 * 60 * 5;
  const roundedDate = new Date(
    Math.floor(updatedAtDate.getTime() / msPer5Min) * msPer5Min
  );
  const updatedAtSeconds = Math.floor(roundedDate.getTime() / 1000);
  const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

  return new EmbedBuilder()
    .setColor(0x89ff5b)
    .setTitle(`Grow a Garden Stock - ${formattedTime}`)
    .setDescription("\u200B")
    .addFields(
      { name: "🌱 Seeds Stock", value: seeds, inline: true },
      { name: "⚙️ Gear Stock", value: gear, inline: true },
      { name: "🥚 Egg Stock", value: egg, inline: true }
    )
    .setThumbnail("https://media2.giphy.com/media/afnFDEL2XsmC6ViFvv/giphy.gif")
    .setImage("https://i.imgur.com/Q8jhixr.png")
    .setTimestamp();
}

let lastStockData = {
  seeds: [],
  gear: [],
  egg: [],
};

async function updateStock() {
  const mainStock = await fetchStockData(`/api/stock?cb=${Date.now()}`);
  const freshStockData = {
    Data: {
      updatedAt: mainStock.updatedAt || Date.now(),
      gear: extractCounts(mainStock.gear || []),
      seeds: extractCounts(mainStock.seeds || []),
      egg: extractCounts(mainStock.egg || []),
    },
  };

  const embed = buildStockEmbed(freshStockData);

  const newlyAvailable = [];
  for (const cat of ["seeds", "gear", "egg"]) {
    for (const item of freshStockData.Data[cat]) {
      const wasMissing = !lastStockData[cat].some((i) => i.name === item.name);
      if (wasMissing) {
        newlyAvailable.push({ category: cat, name: item.name });
      }
    }
  }

  lastStockData = {
    seeds: freshStockData.Data.seeds,
    gear: freshStockData.Data.gear,
    egg: freshStockData.Data.egg,
  };

  const userIds = new Set();
  const roleTargets = [];
  const all = await db.all();
  for (const entry of all) {
    if (!entry.id.startsWith("guild_")) continue;
    const guildId = entry.id.split("_")[1];
    const guildData = entry.value;

    for (const { category, name } of newlyAvailable) {
      const key = `${category}.${name.toLowerCase()}`;
      const sub = guildData[category]?.[name.toLowerCase()];
      if (sub) {
        (sub.users || []).forEach((u) => userIds.add(u));
        if (sub.role) {
          roleTargets.push({ guildId, roleId: sub.role, item: key });
        }
      }
    }
  }
  return {
    embed,
    updatedAt: freshStockData.Data.updatedAt,
    rawData: freshStockData,
    alert: {
      userIds: [...userIds],
      roleTargets,
    },
  };
}

module.exports = { updateStock };
// originially taken from https://github.com/Just3itx/Grow-A-Garden-API
// edited by jadebetty 6.22.25.