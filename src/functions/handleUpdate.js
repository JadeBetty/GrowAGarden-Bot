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
              id: i.item_id.toLowerCase().replace(/_/g, "-"),
            }));

        const updatedAt =
          partialSGStock.seed?.[0]?.start_date_unix ??
          Math.floor(Date.now() / 1000);

        const stock = {
          updatedAt,
          gear: formatItemList(partialSGStock.gear || []),
          seed: formatItemList(partialSGStock.seed || []),
          egg: formatItemList(partialSGStock.egg || []),
        };

        const embed = await BuildEmbeds("SGE", stock);
        const newlyAvailable = [];

        for (const cat of ["seed", "gear", "egg"]) {
          for (const item of stock[cat]) {
            newlyAvailable.push({
              category: cat,
              name: item.name.toLowerCase(),
              id: item.id,
            });
          }
        }

        const userIds = new Set();
        const roleTargets = [];
        const all = await db.all();

        const roleTargetSet = new Set();

        for (const entry of all) {
          if (!entry.id.startsWith("guild_")) continue;

          const guildId = entry.id.split("_")[1];
          const guildData = entry.value;

          for (const { category, name, id } of newlyAvailable) {
            const categoryData = guildData[category];
            if (!categoryData) continue;

            let matchedKey = Object.keys(categoryData).find(
              (key) => key.toLowerCase() === id
            );

            if (!matchedKey) {
              const [firstPart, secondPart] = id.split("-");

              matchedKey = Object.keys(categoryData).find(
                (key) =>
                  key.toLowerCase() === firstPart?.toLowerCase() ||
                  key.toLowerCase() === secondPart?.toLowerCase()
              );
              if (!matchedKey) {
                // console.warn(
                //   `⚠️ Not found in DB: ${category}.${id} for guild ${guildId}`
                // );
                continue;
              }
            }

            const sub = categoryData[matchedKey];
            if (!sub) continue;

            (sub.users || []).forEach((u) => userIds.add(u));

            if (sub.role) {
              const uniqueKey = `${guildId}-${sub.role}`;
              if (!roleTargetSet.has(uniqueKey)) {
                roleTargetSet.add(uniqueKey);
                roleTargets.push({
                  guildId,
                  roleId: sub.role,
                  item: `${category}.${matchedKey}`,
                });
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
          seed: [...stock.seed],
          gear: [...stock.gear],
          egg: [...stock.egg],
        };

        receivedSeed = false;
        receivedGear = false;
        receivedEgg = false;
        debounceTimer = null;
      }, 750);
    }
    if (parsed.weather) {
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
    }
    if (parsed.travelingmerchant_stock) {
      const merchantData = parsed.travelingmerchant_stock;
      const merchant = {
        merchantName: merchantData?.merchantName || "Unknown",
        updatedAt:
          merchantData?.stock?.[0]?.start_date_unix ||
          Math.floor(Date.now() / 1000),
        stock: (merchantData?.stock || [])
          .filter((item) => item.quantity !== 0)
          .map((i) => ({
            name: i.display_name,
            stock: i.quantity.toString(),
            icon: i.icon,
          })),
      };

      const stock = {
        merchantName: merchant.merchantName,
        stock: merchant.stock,
        updatedAt: merchant.updatedAt || Math.floor(Date.now() / 1000),
      };

      const embed = await BuildEmbeds("TMS", stock);
      resolve({
        embed,
        stock,
        type: "TMS",
      });
    }
    if (parsed.eventshop_stock) {
      const eventData = parsed.eventshop_stock;
      const stock = {
        stock: (eventData || [])
          .filter((item) => item.quantity !== 0)
          .map((i) => ({
            name: i.display_name,
            stock: i.quantity.toString(),
            icon: i.icon,
          })),
        updatedAt:
          eventData[0].start_date_unix || Math.floor(Date.now() / 1000),
      };

      const embed = await BuildEmbeds("EVENT", stock);
      resolve({
        embed,
        stock,
        type: "EVENT",
      });
    }

    if(parsed.notification) {
      const notification = parsed.notification.map((msg) => ({
        message: msg.message,
        timestamp: msg.timestamp
      }));
      const embed = await BuildEmbeds("NOTIFICATION", notification);
      resolve({
        embed,
        notification,
        type: "NOTIFICATION"
      });
    }
  });
}

module.exports = {
  handleUpdate,
};
