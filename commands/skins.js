const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

let gameSessions = {};

// Fonction pour récupérer la liste de tous les champions
async function fetchAllChampions() {
  const url =
    "https://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion.json";
  try {
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des champions:",
      error
    );
    return {};
  }
}

// Fonction pour sélectionner un champion aléatoire
async function selectRandomChampion(champions) {
  const championKeys = Object.keys(champions);
  const randomKey =
    championKeys[Math.floor(Math.random() * championKeys.length)];
  return champions[randomKey];
}

// Fonction pour récupérer les détails d'un champion
async function fetchChampionDetails(championId) {
  const url = `https://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion/${championId}.json`;
  try {
    const response = await axios.get(url);
    return response.data.data[championId];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails du champion:",
      error
    );
    return null;
  }
}

// Fonction pour sélectionner un skin aléatoire
async function selectRandomSkin(champion) {
  const randomSkin =
    champion.skins[Math.floor(Math.random() * champion.skins.length)];
  return randomSkin;
}

// Fonction pour démarrer une session de devinette de skin
async function processGuessSkin(message) {
  if (gameSessions[message.channel.id] && !message.content.includes("reset")) {
    const embed = new EmbedBuilder()
      .setTitle("Déjà en cours")
      .setDescription(
        "Il y a déjà une session de devinette de skin en cours. Utilisez `!skins reset` pour en démarrer une nouvelle."
      )
      .setColor(0x0099ff);
    return message.channel.send({ embeds: [embed] });
  }

  const champions = await fetchAllChampions();
  const randomChampion = await selectRandomChampion(champions);
  const championDetails = await fetchChampionDetails(randomChampion.id);

  if (championDetails) {
    const randomSkin = await selectRandomSkin(championDetails);
    gameSessions[message.channel.id] = {
      championId: championDetails.id,
      skin: randomSkin,
    };

    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championDetails.id}_${randomSkin.num}.jpg`;
    const embed = new EmbedBuilder()
      .setTitle("Qui est ce champion ?")
      .setImage(imageUrl)
      .setColor(0x0099ff);
    await message.channel.send({ embeds: [embed] });
  } else {
    console.log("Impossible de récupérer les détails du champion sélectionné.");
  }
}

// Fonction pour arrêter une session de jeu
function stopGameSession(channelId) {
  if (gameSessions[channelId]) {
    delete gameSessions[channelId];
    return true;
  }
  return false;
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);

  if (args[0] === "stop") {
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
    // Réinitialiser ou démarrer une nouvelle session de jeu
    delete gameSessions[message.channel.id];
    await processGuessSkin(message);
  } else if (args.length > 0) {
    // Vérification de la réponse de l'utilisateur
    const guess = args.join(" ").toLowerCase();
    if (guess === gameSessions[message.channel.id]?.championId.toLowerCase()) {
      const embed = new EmbedBuilder()
        .setTitle("Félicitations !")
        .setDescription("Vous avez correctement identifié le champion.")
        .setColor(0x0099ff);
      await message.channel.send({ embeds: [embed] });
      updateScore(message.author.id, "skins", 1);
      delete gameSessions[message.channel.id];
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Mauvaise réponse")
        .setDescription("Essayez encore !")
        .setColor(0xff0000);
      await message.channel.send({ embeds: [embed] });
    }
  } else {
    // Commencer une nouvelle session de jeu si aucune n'est active
    await processGuessSkin(message);
  }
};
