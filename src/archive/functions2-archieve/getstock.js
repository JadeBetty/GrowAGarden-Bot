const WebSocket = require("ws");
const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { logger } = require("console-wizard");

const user_id = "758617912566087681";

const partialStock = {
  seed: null,
  gear: null,
  egg: null,
  cosmetic: null,
  eventshop: null,
  merchant: null,
  lastUpdate: 0,
};

let lastStockData = null;

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

function buildStockEmbed(stock) {
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
}

function handleStockUpdate(mainStock) {
  const updatedAt =
    mainStock.seed_stock?.[0]?.start_date_unix ?? Math.floor(Date.now() / 1000);
  const formatItemList = (list) =>
    list
      .filter((item) => item.quantity !== 0)
      .map((i) => ({
        name: i.display_name,
        stock: i.quantity.toString(),
      }));

  const stock = {
    updatedAt,
    gear: formatItemList(mainStock.gear_stock || []),
    seeds: formatItemList(mainStock.seed_stock || []),
    egg: formatItemList(mainStock.egg_stock || []),
  };

  const embed = buildStockEmbed(stock);
  const newlyAvailable = [];

  if (lastStockData !== null) {
    for (const cat of ["seeds", "gear", "egg"]) {
      for (const item of stock[cat]) {
        const wasMissing = !lastStockData[cat].some(
          (i) => i.name === item.name
        );
        if (wasMissing) {
          newlyAvailable.push({ category: cat, name: item.name });
        }
      }
    }
  }

  lastStockData = {
    seeds: [...stock.seeds],
    gear: [...stock.gear],
    egg: [...stock.egg],
  };

  return { embed, updatedAt: stock.updatedAt, newlyAvailable, stock };
}

function startWebSocketStockListener(onEmbedGenerated) {
  const ws = new WebSocket(
    `wss://websocket.joshlei.com/growagarden?user_id=${encodeURIComponent(
      user_id
    )}`
  );

  ws.on("open", () => {
    logger.success("[WS] WebSocket connected successfully.");
  });

  ws.on("message", async (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    if (!parsed || typeof parsed !== "object") return;

    const now = Date.now();


    if (now - partialStock.lastUpdate > 30 * 1000) {
      partialStock.seed = null;
      partialStock.gear = null;
    }

    partialStock.lastUpdate = now;

    if (parsed.seed_stock) partialStock.seed = parsed.seed_stock;
    if (parsed.gear_stock) partialStock.gear = parsed.gear_stock;


    if (parsed.egg_stock) partialStock.egg = parsed.egg_stock;
    if (parsed.cosmetic_stock) partialStock.cosmetic = parsed.cosmetic_stock;
    if (parsed.eventshop_stock) partialStock.eventshop = parsed.eventshop_stock;
    if (parsed.travelingmerchant_stock) partialStock.merchant = parsed.travelingmerchant_stock;


    const stocksReady = partialStock.seed && partialStock.gear;
    if (!stocksReady) return logger.warn(`[Stock] Stock's not ready.`);

    const fullPayload = {
      seed_stock: partialStock.seed,
      gear_stock: partialStock.gear,
      egg_stock: partialStock.egg ?? [],
      cosmetic_stock: partialStock.cosmetic ?? [],
      eventshop_stock: partialStock.eventshop ?? [],
      travelingmerchant_stock: partialStock.merchant ?? [],
    };

    partialStock.seed = null;
    partialStock.gear = null;

    const { embed, updatedAt, newlyAvailable, stock } = handleStockUpdate(fullPayload);

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

    onEmbedGenerated({
      embed,
      updatedAt,
      alert: {
        userIds: [...userIds],
        roleTargets,
      },
      data: {
        Data: stock,
      },
    });

  } catch (err) {
    console.log(err);
    logger.error("[WS] Failed to handle WS stock update:", err);
  }
});


  ws.on("error", (err) => {
    logger.error("[WS] WebSocket error:", err);
  });

  ws.on("close", () => {
    logger.warn("[WS] WebSocket closed. Reconnecting in 5s...");
    setTimeout(() => startWebSocketStockListener(onEmbedGenerated), 5000);
  });
}

module.exports = {
  startWebSocketStockListener,
};
