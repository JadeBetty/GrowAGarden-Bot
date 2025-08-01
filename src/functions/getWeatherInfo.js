const https = require("https");
const { logger } = require("console-wizard");

function getWeatherInfo(id, key) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.joshlei.com",
      path: `/v2/growagarden/info/${id}`,
      method: "GET",
      headers: {
        "jstudio-key": key,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          let raw = JSON.parse(data);

          if (raw.error) {
            logger.warn(`[Error] Info API error: ${raw.error}`);
            const pretty = {
              name: "Not found",
              id: "not-found",
              description: "Not found",
              icon:
                "https://images-ext-1.discordapp.net/external/Rd1pMc1eVWWy6x9_pxPdANdaV4AA8y1b431OcJGImSQ/https/tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter?format=webp",
            };
            return resolve(pretty);
          }

          const pretty = {
            name: raw.display_name,
            id: raw.item_id,
            description: raw.description,
            icon: raw.icon,
          };

          resolve(pretty);
        } catch (err) {
          logger.error(
            `[Weather] Failed to parse info API data. Error msg: ${err.message}`
          );
          const pretty = {
            name: "Not found",
            id: "not-found",
            description: "Not found",
            icon:
              "https://images-ext-1.discordapp.net/external/Rd1pMc1eVWWy6x9_pxPdANdaV4AA8y1b431OcJGImSQ/https/tr.rbxcdn.com/180DAY-1db1ca86a77e30e87e2ffa3e38b8aece/256/256/Image/Webp/noFilter?format=webp",
          };
          return resolve(pretty);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

module.exports = {
  getWeatherInfo,
};