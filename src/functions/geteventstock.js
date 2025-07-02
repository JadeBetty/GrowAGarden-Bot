const { EmbedBuilder, time, TimestampStyles } = require("@discordjs/builders");
const https = require("https");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { logger } = require("console-wizard");

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
              console.log(raw);
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
                eventstock: [],
                api: false,
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
              updatedAt: raw.eventshop_stock[0].start_date_unix,
              eventstock: filterAndMap(raw.eventshop_stock),
              api: true,
            };

            resolve(pretty);
          } catch (err) {
            console.log(err);
            logger.error(`[Error] Failed to fetch data. Error: ${err.message}`);

            const fallback = {
              updatedAt: Date.now(),
              eventstock: [],
              api: false,
            };
            resolve(fallback);
          }
        });
      })
      .on("error", reject);
  });
}

function buildStockEmbed(stock) {
  const event =
    (stock.Data.eventshop || [])
      .map((item) => `**x${item.stock}** :farmer: ${item.name}`)
      .join("\n") || "None";


  const updatedAtDate = new Date(stock.Data.updatedAt * 1000);
  const msPer5Min = 1000 * 60 * 5;
  const roundedDate = new Date(
    Math.floor(updatedAtDate.getTime() / msPer5Min) * msPer5Min
  );
  const updatedAtSeconds = Math.floor(roundedDate.getTime() / 1000);
  const formattedTime = time(updatedAtSeconds, TimestampStyles.ShortTime);

  return new EmbedBuilder()
    .setColor(0x7be551)
    .setTitle(`Grow A Garden Stock - ${formattedTime}`)
    .addFields({ name: "👨‍🌾 Event shop", value: event, inline: true })
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

let lastEventStockData = null;

async function updateEventStock() {
  let mainStock = await fetchStockData(
    `https://api.joshlei.com/v2/growagarden/stock`
  );

  const freshEventStockData = {
    Data: {
      updatedAt: mainStock.updatedAt,
      eventshop: mainStock.eventstock,
    },
  };

  const embed = buildStockEmbed(freshEventStockData);

  lastEventStockData = {
    eventshop: [...freshEventStockData.Data.eventshop],
  };

  return {
    embed,
    updatedAt: freshEventStockData.Data.updatedAt,
    rawData: freshEventStockData,
  };
}

module.exports = { updateEventStock };
