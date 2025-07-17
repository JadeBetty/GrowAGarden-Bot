const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { logger } = require("console-wizard");

const partialStock = {
  seed: null,
  gear: null,
  egg: null,
  cosmetic: null,
  eventshop: null,
  merchant: null,
  lastUpdate: 0,
};

async function handleStockUpdate(parsed, onEmbedGenerated) {
  const now = Date.now();

  if (now - partialStock.lastUpdate > 30 * 1000) {
    partialStock.seed = null;
    partialStock.gear = null;
  }


  

  if (parsed.seed_stock) partialStock.seed = parsed.seed_stock;
  if (parsed.gear_stock) partialStock.gear = parsed.gear_stock;

  if (parsed.egg_stock) partialStock.egg = parsed.egg_stock;


  
  const fullPayload = {
    seed_stock: partialStock.seed,
    gear_stock: partialStock.gear,
    egg_stock: partialStock.egg ?? [],
    cosmetic_stock: partialStock.cosmetic ?? [],
    eventshop_stock: [], // still empty?
    travelingmerchant_stock: partialStock.merchant ?? [],
  };

  if (parsed.cosmetic_stock) {
    const { embed, stock } = handleCosmeticUpdate(fullPayload);
    onEmbedGenerated({
      embed,
      updatedAt: stock.updatedAt,
      alert: null,
      data: { Data: stock },
    });
  }

  if (parsed.travelingmerchant_stock) {
    const { embed, stock } = handleMerchantUpdate(fullPayload);
    onEmbedGenerated({
      embed,
      updatedAt: stock.updatedAt,
      alert: null,
      data: { Data: stock },
    });
  }


  partialStock.seed = null;
  partialStock.gear = null;

  const { embed, updatedAt, newlyAvailable, stock } =
    handleSGStockUpdate(fullPayload);

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
}

function handleCosmeticUpdate(payload) {
  const cosmetics = (payload.cosmetic_stock || [])
    .filter((item) => item.quantity !== 0)
    .map((i) => ({
      name: i.display_name,
      stock: i.quantity.toString(),
      icon: i.icon,
    }));

  const stock = {
    cosmetic: cosmetics,
    updatedAt: Math.floor(Date.now() / 1000),
  };

  const embed = buildCosmeticEmbed(stock);
  return { embed, stock };
}

function handleMerchantUpdate(payload) {
  const merchant = (payload.travelingmerchant_stock || [])
    .filter((item) => item.quantity !== 0)
    .map((i) => ({
      name: i.display_name,
      stock: i.quantity.toString(),
      icon: i.icon,
    }));

  const stock = {
    merchant: merchant,
    updatedAt: Math.floor(Date.now() / 1000),
  };

  const embed = buildMerchantEmbed(stock);
  return { embed, stock };
}

function buildCosmeticEmbed(stock) {
  const cosmetics =
    (stock.cosmetic || [])
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
}

function buildMerchantEmbed(stock) {
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

function handleSGStockUpdate(mainStock) {
  let lastStockData = null;
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

module.exports = {
  handleStockUpdate,
};
