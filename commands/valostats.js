const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { HENRIK_API_KEY } = require("../config/config");

module.exports = async function valostats(message) {
  const args = message.content.trim().split(" ");
  if (args.length < 2) {
    return message.reply("Utilisation : `!valostats Nom#Tag`");
  }

  const [name, tag] = args[1].split("#");
  if (!name || !tag) {
    return message.reply("Format invalide. Utilise : `Nom#Tag`");
  }

  try {
    const res = await axios.get(
      `https://api.henrikdev.xyz/valorant/v3/matches/eu/${name}/${tag}?size=10`,
      {
        headers: { Authorization: HENRIK_API_KEY },
      }
    );

    const matches = res.data.data;

    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let wins = 0;
    let total = 0;
    const agentCount = {};

    for (const match of matches) {
      const player = match.players.all_players.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (!player) continue;

      totalKills += player.stats.kills;
      totalDeaths += player.stats.deaths;
      totalAssists += player.stats.assists;
      total++;

      const agent = player.character;
      agentCount[agent] = (agentCount[agent] || 0) + 1;

      if (match.teams?.[player.team.toLowerCase()]?.has_won) {
        wins++;
      }
    }

    const favoriteAgent =
      Object.entries(agentCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Inconnu";
    const kda =
      totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "Perfect";
    const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "N/A";

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`Statistiques Valorant de ${name}#${tag}`)
      .addFields(
        { name: "🎯 Kills", value: `${totalKills}`, inline: true },
        { name: "💀 Deaths", value: `${totalDeaths}`, inline: true },
        { name: "🛡 Assists", value: `${totalAssists}`, inline: true },
        { name: "📊 KDA", value: `${kda}`, inline: true },
        { name: "🥇 Agent préféré", value: `${favoriteAgent}`, inline: true },
        { name: "🏆 Winrate", value: `${winrate}`, inline: true }
      )
      .setFooter({ text: "Basé sur les 10 derniers matchs" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err.response?.data || err);
    message.reply("❌ Erreur lors de la récupération des statistiques.");
  }
};
