const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const https = require("https");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { logger } = require("console-wizard");

function fetchStockDataOLD() {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      hostname: "www.gamersberg.com",
      path: "/api/grow-a-garden/stock",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.5",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
        cookie: "usprivacy=1---; cumulative_time=s%3A621.747.9M0O3EOYoemYI8AFX75ENje0cyiWWvhsn2tTzG0o6Gs; last_session_day=s%3A2025-07-04.nZ4sfHPu%2B2qS%2Bgf7TqmU9ZDnHIWjmtCucAepx%2Fy86N8; session_start=s%3A1751628954893.3C72yp8jiKnltxOEpMN5wuaF1osi%2BD8IMCoOzTLX8xo; _lr_retry_request=true; _lr_env_src_ats=false; _lr_sampling_rate=0",
        referer: "https://www.gamersberg.com/grow-a-garden/stock",
        connection: "keep-alive"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const raw = JSON.parse(data);
          const dataObj = (raw.data && raw.data[0]) || null;

          const filterAndMap = (obj) =>
            Object.entries(obj)
              .filter(([_, v]) => v !== "0")
              .map(([name, stock]) => ({ name, stock }));

          const pretty = dataObj
            ? {
                updatedAt: Date.now() / 1000,
                gear: filterAndMap(dataObj.gear),
                seeds: filterAndMap(dataObj.seeds),
                egg: (dataObj.eggs || []).map((e) => ({
                  name: e.name,
                  stock: e.quantity.toString(),
                })),
              }
            : {
                updatedAt: Date.now(),
                gear: [],
                seeds: [],
                egg: [],
                api: false,
              };

          resolve(pretty);
        } catch (err) {
          console.error(err);
          resolve({
            updatedAt: Date.now(),
            gear: [],
            seeds: [],
            egg: [],
            api: false,
          });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}



function fetchStockData(url, retryCount = 3) {
  return new Promise((resolve, reject) => {
    https
      .get(`${url}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            let raw = JSON.parse(data);

            if (raw.error && raw.retry_after_seconds && retryCount > 0) {
              logger.warn(
                `Rate limited. Retrying in ${raw.retry_after_seconds}s...`
              );
              setTimeout(() => {
                fetchStockData(url, retryCount - 1)
                  .then(resolve)
                  .catch(reject);
              }, raw.retry_after_seconds * 1000);
              return;
            }

            if (raw.error) {
              logger.warn("Unhandled error:", raw.error);
              const pretty = {
                updatedAt: Date.now(),
                gear: [],
                seeds: [],
                egg: [],
                api: false
              };
              return resolve(pretty);
            }

            const filterAndMap = (obj) =>
              obj
                .filter((item) => item.quantity !== 0)
                .map(({ display_name, quantity }) => ({
                  name: display_name,
                  stock: quantity.toString(),
                }));

            const pretty = {
              updatedAt: raw.seed_stock[0].start_date_unix,
              gear: filterAndMap(raw.gear_stock),
              seeds: filterAndMap(raw.seed_stock),
              egg: filterAndMap(raw.egg_stock),
              api: true
            };

            resolve(pretty);
          } catch (err) {
            console.log(err);
            logger.error(
              `[Error] Failed to fetch data. Error message: ${err.message}`
            );

            const fallback = {
              updatedAt: Date.now(),
              gear: [],
              seeds: [],
              egg: [],
              api: false
            };
            resolve(fallback);
          }
        });
      })
      .on("error", reject);
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
  if (lower.includes("magnifying glass")) return "🔍"
  if (lower.includes("kiwi")) return "🥝";
  if (lower.includes("pear")) return "🍐"
  if (lower.includes("bell pepper")) return ":bell_pepper:";
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

  const updatedAtDate = new Date(stock.Data.updatedAt * 1000);
  const msPer5Min = 1000 * 60 * 5;
  const roundedDate = new Date(
    Math.floor(updatedAtDate.getTime() / msPer5Min) * msPer5Min
  );
  const updatedAtSeconds = Math.floor(roundedDate.getTime() / 1000);
  const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

  return new EmbedBuilder()
    .setColor(0x7BE551)
    .setTitle(`Grow a Garden Stock - ${formattedTime}`)
    .addFields(
      { name: "  🌱 Seed Stock", value: seeds },
      { name: "  ⚙️ Gear Stock", value: gear },
      { name: "  🥚 Egg Stock", value: egg }
    )
    .setThumbnail("https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter")
    .setFooter({ text: "Grow A Garden", iconURL: "https://tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter"})
    .setTimestamp();
}


let lastStockData = null;

async function updateStock() {
  let mainStock = await fetchStockData(
      `https://api.joshlei.com/v2/growagarden/stock`
    );

  if (mainStock.api === false || !mainStock) mainStock = await fetchStockDataOLD(`https://www.gamersberg.com/api/grow-a-garden/stock`);

  const freshStockData = {
    Data: {
      updatedAt: mainStock.updatedAt,
      gear: mainStock.gear,
      seeds: mainStock.seeds,
      egg: mainStock.egg,
    },
  };

  const eggs = freshStockData.Data.egg;

  if (
    eggs.length === 1 &&
    eggs[0].name === "Common Egg" &&
    parseInt(eggs[0].stock) === 1
  ) {
    eggs[0].stock = "3";
  }

  const embed = buildStockEmbed(freshStockData);

  const newlyAvailable = [];

  if (lastStockData !== null) {
    for (const cat of ["seeds", "gear", "egg"]) {
      for (const item of freshStockData.Data[cat]) {
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
    seeds: [...freshStockData.Data.seeds],
    gear: [...freshStockData.Data.gear],
    egg: [...freshStockData.Data.egg],
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
