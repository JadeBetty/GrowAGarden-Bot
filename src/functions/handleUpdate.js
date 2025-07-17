const { BuildEmbeds } = require("./buildEmbeds");
const { getWeatherInfo } = require("./getWeatherInfo");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const partialSGStock = {
  seed: null,
  gear: null,
  egg: null,
};

let lastSGStockData = null;
let receivedSeed = false;
let receivedGear = false;
let receivedEgg = false;
let debounceTimer = null;

async function handleUpdate(parsed) {
  return new Promise(async (resolve) => {
    if (parsed.seed_stock) {
      partialSGStock.seed = parsed.seed_stock;
      receivedSeed = true;
    }
    if (parsed.gear_stock) {
      partialSGStock.gear = parsed.gear_stock;
      receivedGear = true;
    }
    if (parsed.egg_stock) {
      partialSGStock.egg = parsed.egg_stock;
      receivedEgg = true;
    }

    if (parsed.seed_stock || parsed.gear_stock || parsed.egg_stock) {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        const hasRequiredStock = partialSGStock.seed && partialSGStock.gear;
        if (!hasRequiredStock) return;

        const formatItemList = (list) =>
          list
            .filter((item) => item.quantity !== 0)
            .map((i) => ({
              name: i.display_name,
              stock: i.quantity.toString(),
            }));

        const updatedAt =
          partialSGStock.seed?.[0]?.start_date_unix ??
          Math.floor(Date.now() / 1000);

        const stock = {
          updatedAt,
          gear: formatItemList(partialSGStock.gear || []),
          seeds: formatItemList(partialSGStock.seed || []),
          egg: formatItemList(partialSGStock.egg || []),
        };

        const embed = await BuildEmbeds("SGE", stock);
        const newlyAvailable = [];

        if (lastSGStockData !== null) {
          for (const cat of ["seeds", "gear", "egg"]) {
            for (const item of stock[cat]) {
              const wasMissing = !lastSGStockData[cat].some(
                (i) => i.name === item.name
              );
              if (wasMissing) {
                newlyAvailable.push({ category: cat, name: item.name });
              }
            }
          }
        }

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

        resolve({
          embed,
          updatedAt: stock.updatedAt,
          alert: {
            userIds: [...userIds],
            roleTargets,
          },
          newlyAvailable,
          stock,
          type: "SGE",
        });

        lastSGStockData = {
          seeds: [...stock.seeds],
          gear: [...stock.gear],
          egg: [...stock.egg],
        };

        receivedSeed = false;
        receivedGear = false;
        receivedEgg = false;
        debounceTimer = null;
      }, 750);
    } else if (parsed.weather) {
      let activeWeather = parsed.weather
        .filter((w) => w.active === true)
        .map((w) => ({
          name: w.weather_name,
          id: w.weather_id,
          duration: w.duration,
          startAt: w.start_duration_unix,
        }));

      const embed = [];
      for (const w of activeWeather) {
        const weatherInfo = await getWeatherInfo(w.id);
        embed.push(await BuildEmbeds("WEATHER", weatherInfo));
      }
      resolve({
        embed,
        activeWeather,
        type: "weather",
      });
    } else if (parsed.travelingmerchant_stock) {
    const merchant = (parsed.travelingmerchant_stock || [])
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

    const embed = BuildEmbeds("TMS", stock);
    resolve({
      embed,
      stock,
      type: "TMS"
    })
  }
  });

  
}

module.exports = {
  handleUpdate,
};
