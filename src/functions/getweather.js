const { EmbedBuilder } = require("@discordjs/builders");
const https = require("https");
const { logger } = require("console-wizard");

function fetchWeatherData(url, retryCount = 3) {
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
                `[Error] Rate limited, retrying in ${raw.retry_after_seconds}s...`
              );
              setTimeout(() => {
                fetchStockData(url, retryCount - 1)
                  .then(resolve)
                  .catch(reject);
              }, raw.retry_after_seconds * 1000);
              return;
            }

            if (raw.error) {
              logger.warn("[Error] Unhandled error:", raw.error);
              const pretty = {
                name: "Not found",
                id: "not-found",
                duration: 60,
                startAt: 0,
              };
              return resolve(pretty);
            }

            let pretty = raw.weather
              .filter((w) => w.active === true)
              .map((w) => ({
                name: w.weather_name,
                id: w.weather_id,
                duration: w.duration,
                startAt: w.start_duration_unix,
              }));

            resolve(pretty);
          } catch (err) {
            logger.error(
              `[Weather] Failed to fetch weather data. Error msg: ${err.message}`
            );
            const pretty = {
              name: "Not found",
              id: "not-found",
              duration: 60,
              startAt: 0,
            };
            return resolve(pretty);
          }
        });
      })
      .on("error", reject);
  });
}

function getEmoji(name) {
  const lower = name.toLowerCase();
  if (lower.includes("rain")) return "🌧";
  if (lower.includes("thunderstorm")) return "⛈";
  if (lower.includes("disco")) return "🕺";
  if (lower.includes("jandelstorm")) return "🐵🌧";
  if (lower.includes("blackhole")) return "⚫";
  if (lower.includes("djjhai")) return "🎉";
  if (lower.includes("nightevent")) return "🌙";
  if (lower.includes("meteorshower")) return "⭐🚿";
  if (lower.includes("sungod")) return "☀🐒";
  if (lower.includes("jandelfloat")) return "🐵";
  if (lower.includes("chocolaterain")) return "🍫🌧";
  if (lower.includes("volcano")) return "🌋";
  if (lower.includes("alieninvasion")) return "👽";
  if (lower.includes("spacetravel")) return "🚀";
  if (lower.includes("windy")) return "🍃";
  if (lower.includes("heatwave")) return "🥵";
  if (lower.includes("tornado")) return "🌪";
  return "❓";
}

function buildWeatherEmbed(weather) {
  return new EmbedBuilder()
    .setColor(0x89ff5b)
    .setTitle(`${weather.name}`)
    .setDescription(
      `${getEmoji(weather.id)} There is a ${
        weather.name
      } right now!`
    )
    .setTimestamp();
}

async function updateWeather() {
  const weather = await fetchWeatherData(
    `https://api.joshlei.com/v2/growagarden/weather`
  );

  if (!Array.isArray(weather) || weather.length === 0)
    return {
      embeds: [],
      weather: [
        {
          name: "Not found",
          id: "not-found",
          duration: 60,
          startAt: 0,
        },
      ],
    };

  const embeds = [];
  weather.forEach((weather) => {
    embeds.push(buildWeatherEmbed(weather));
  });

  return {
    embeds,
    weather,
  };
}

module.exports = { updateWeather };
