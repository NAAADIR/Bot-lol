require("dotenv").config();
// Clé d'API pour Riot Games
// Clé d'API pour Discord
module.exports = {
  RIOT_API_KEY: process.env.RIOT_API_KEY,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
};
