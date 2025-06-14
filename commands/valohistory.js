const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { HENRIK_API_KEY } = require("../config/config");

function getMapImage(mapName) {
  const maps = {
    Ascent:
      "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/listviewicon.png",
    Bind: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/listviewicon.png",
    Haven:
      "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/listviewicon.png",
    Split:
      "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/listviewicon.png",
    Icebox:
      "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/listviewicon.png",
    Breeze:
      "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/listviewicon.png",
    Pearl:
      "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/listviewicon.png",
    Lotus:
      "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/listviewicon.png",
    Fracture:
      "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/listviewicon.png",
    Sunset:
      "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/listviewicon.png",
  };
  return maps[mapName] || null;
}

module.exports = async function valohistory(message) {
  const args = message.content.trim().split(" ");

  if (args.length < 2) {
    return message.reply("Utilisation : `!valohistory [1‑5] Nom#Tag`");
  }

  let matchCount = 1;
  let nameTag;

  if (!isNaN(parseInt(args[1]))) {
    matchCount = parseInt(args[1]);
    nameTag = args[2];
  } else {
    nameTag = args[1];
  }

  if (matchCount < 1 || matchCount > 5) {
    return message.reply("Tu dois demander entre 1 et 5 matchs.");
  }

  const [name, tag] = nameTag.split("#");
  if (!name || !tag) {
    return message.reply("Format invalide. Utilise : `Nom#Tag`");
  }

  try {
    const res = await axios.get(
      `https://api.henrikdev.xyz/valorant/v3/matches/eu/${name}/${tag}?size=${matchCount}`,
      { headers: { Authorization: HENRIK_API_KEY } }
    );

    const matches = res.data.data;
    for (const match of matches) {
      const player = match.players.all_players.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (!player) continue;

      const won = match.teams[player.team.toLowerCase()].has_won;
      const color = won ? 0x00ff00 : 0xff0000;
      const kda = `${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`;
      const score = `${match.teams.red.rounds_won}–${match.teams.blue.rounds_won}`;
      const mapName = match.metadata.map;
      const mapImg = getMapImage(mapName);
      const agentImg = player.assets.agent.small;
      const mode = match.metadata.mode || "Inconnu";

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${won ? "Victoire" : "Défaite"} - ${mapName}`)
        .setDescription(`**Mode** : ${mode}\n**Score** : ${score}`)
        .addFields(
          { name: "Agent", value: player.character, inline: true },
          { name: "KDA", value: kda, inline: true },
          { name: "Team", value: player.team, inline: true }
        )
        .setThumbnail(agentImg)
        .setImage(mapImg)
        .setTimestamp(new Date(match.metadata.game_start * 1000));

      await message.channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err.response?.data || err);
    return message.reply("❌ Erreur lors de la récupération des matchs.");
  }
};
