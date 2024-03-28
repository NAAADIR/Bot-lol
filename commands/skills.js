const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

let gameSessions = {};

// Fonction pour récupérer la liste de tous les champions
async function fetchAllChampions() {
  const url =
    "http://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion.json";
  try {
    const response = await axios.get(url);
    return Object.keys(response.data.data);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des champions:",
      error
    );
    return [];
  }
}

// Fonction pour récupérer les données d'un champion
async function fetchChampionData(championName) {
  const url = `http://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion/${championName}.json`;
  try {
    const response = await axios.get(url);
    return response.data.data[championName];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données du champion:",
      error
    );
    return null;
  }
}

async function selectRandomChampion(championList) {
  const randomIndex = Math.floor(Math.random() * championList.length);
  return championList[randomIndex];
}

async function processGuessSkill(message) {
  if (!gameSessions[message.channel.id]) {
    const championList = await fetchAllChampions();
    const randomChampion = await selectRandomChampion(championList);
    gameSessions[message.channel.id] = { championName: randomChampion };
  }

  const championData = await fetchChampionData(
    gameSessions[message.channel.id].championName
  );

  if (championData) {
    const spells = championData.spells;
    const randomSpell = spells[Math.floor(Math.random() * spells.length)];

    const embed = new EmbedBuilder()
      .setTitle(`Indice pour deviner le champion`)
      .setDescription(`Nom du sort : ${randomSpell.name}`)
      .setImage(
        `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/spell/${randomSpell.image.full}`
      )
      .setColor(0x0099ff);

    message.channel.send({ embeds: [embed] });
  } else {
    message.channel.send("Impossible de récupérer les données du champion.");
  }
}

function stopGameSession(channelId) {
  if (gameSessions[channelId]) {
    delete gameSessions[channelId];
    return true;
  }
  return false;
}

function normalizeName(name) {
  return name.replace(/\s+/g, "").toLowerCase();
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);

  if (args[0] === "stop") {
    // Logique pour arrêter la session de jeu
    const stopped = stopGameSession(message.channel.id);
    if (stopped) {
      const embed = new EmbedBuilder()
        .setTitle("Session arrêtée")
        .setDescription("La session de jeu a été arrêtée.")
        .setColor(0x0099ff);
      message.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Aucune session")
        .setDescription("Aucune session de jeu en cours.")
        .setColor(0x0099ff);
      message.channel.send({ embeds: [embed] });
    }
  } else if (args[0] === "reset" || !gameSessions[message.channel.id]) {
    if (args[0] === "reset" && gameSessions[message.channel.id]) {
      // Si une session existait déjà et que l'utilisateur demande un reset
      delete gameSessions[message.channel.id];
    }
    // Commence ou recommence une session de jeu avec un nouveau champion
    await processGuessSkill(message);
  } else if (args.length > 0) {
    const guess = args.join(" ");
    if (
      gameSessions[message.channel.id] &&
      normalizeName(guess) ===
        normalizeName(gameSessions[message.channel.id].championName)
    ) {
      // Utilisateur a correctement deviné le champion
      const embed = new EmbedBuilder()
        .setTitle("Félicitations !")
        .setDescription(
          `Vous avez deviné le champion : ${
            gameSessions[message.channel.id].championName
          }.`
        )
        .setColor(0x0099ff);
      message.channel.send({ embeds: [embed] });
      updateScore(message.author.id, "skills", 1);
      delete gameSessions[message.channel.id];
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Essai incorrect")
        .setDescription("Ce n'est pas le bon champion. Essayez encore !")
        .setColor(0xff0000);
      message.channel.send({ embeds: [embed] });
    }
  } else {
    // Si l'utilisateur tape juste "!skills" sans argument alors qu'une session est déjà en cours
    const embed = new EmbedBuilder()
      .setTitle("Session en cours")
      .setDescription(
        "Il y a déjà une session de jeu en cours. Devinez le champion ou utilisez `!skills reset` pour commencer une nouvelle session."
      )
      .setColor(0x0099ff);
    message.channel.send({ embeds: [embed] });
  }
};
