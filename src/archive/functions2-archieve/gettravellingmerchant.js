const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const https = require("https");
const { logger } = require("console-wizard");

function fetchStockData(url, retryCount = 3) {
  return new Promise((resolve, reject) => {
    https
      .get(`${url}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const raw = JSON.parse(data);

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

            if (!Array.isArray(raw.travelingmerchant_stock)) {
              logger.warn("[Merchant] travelingmerchant_stock is missing or invalid.");
              return resolve({ updatedAt: Date.now(), merchantStock: [], api: false });
            }

            const filtered = raw.travelingmerchant_stock.filter(
              (item) => item.quantity > 0
            );

            const formatted = filtered.map((item) => ({
              name: item.display_name,
              stock: item.quantity.toString(),
              icon: item.icon || null,
            }));

            const updatedAt =
              filtered[0]?.start_date_unix || Date.now();

            resolve({
              updatedAt,
              merchantStock: formatted,
              api: true,
            });
          } catch (err) {
            logger.error(`[Error] Failed to fetch merchant stock. Error: ${err.message}`);
            resolve({
              updatedAt: Date.now(),
              merchantStock: [],
              api: false,
            });
          }
        });
      })
      .on("error", reject);
  });
}

function buildMerchantEmbed(stock) {
  const merchantItems =
    stock.Data.merchantStock.length > 0
      ? stock.Data.merchantStock
          .map((item) => `**x${item.stock}** ${item.name}`)
          .join("\n")
      : "None";

  const updatedAtDate = new Date(stock.Data.updatedAt * 1000);
  const msPer5Min = 1000 * 60 * 5;
  const roundedDate = new Date(
    Math.floor(updatedAtDate.getTime() / msPer5Min) * msPer5Min
  );
  const updatedAtSeconds = Math.floor(roundedDate.getTime() / 1000);
  const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

  const merchantTimes = [
    1751068800,
    1751083200,
    1751097600,
    1751112000,
    1751126400,
    1751140800,
  ]
    .map((t) => `<t:${t}:t>`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(0xffbe5c)
    .setTitle(`Traveling Merchant Stock - ${formattedTime}`)
    .addFields({ name: "🧳 Merchant Items", value: merchantItems })
    .addFields({
      name: "⏰ Merchant Arrival Times",
      value: `${merchantTimes}\n_(Not guaranteed each time)_`,
    })
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

async function updateMerchantStock() {
  const merchant = await fetchStockData(
    "https://api.joshlei.com/v2/growagarden/stock"
  );

  const freshMerchantData = {
    Data: {
      updatedAt: merchant.updatedAt,
      merchantStock: merchant.merchantStock,
    },
  };

  const embed = buildMerchantEmbed(freshMerchantData);

  return {
    embed,
    updatedAt: freshMerchantData.Data.updatedAt,
    rawData: freshMerchantData,
  };
}

module.exports = { updateMerchantStock };
