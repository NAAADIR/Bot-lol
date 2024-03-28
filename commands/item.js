const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

let gameSessions = {};

// Fonction pour récupérer la liste de tous les objets
async function fetchAllItems() {
  const url =
    "http://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/item.json";
  try {
    const response = await axios.get(url);
    return response.data.data; 
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des objets:",
      error
    );
    return {};
  }
}

async function selectRandomItem(itemsData) {
  const itemKeys = Object.keys(itemsData);
  const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
  // Retourne un objet au hasard
  return itemsData[randomKey]; 
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);

  if (args[0] === "stop") {
    if (gameSessions[message.channel.id]) {
      delete gameSessions[message.channel.id];
      message.channel.send("Session de jeu arrêtée.");
    } else {
      message.channel.send("Aucune session de jeu en cours.");
    }
  } else if (args.length > 0) {
    // L'utilisateur tente de deviner le nom de l'objet
    if (gameSessions[message.channel.id]) {
      const guess = args.join(" ").toLowerCase();
      const correctName =
        gameSessions[message.channel.id].itemName.toLowerCase();

      if (guess === correctName) {
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Félicitations !")
          .setDescription(
            `Vous avez correctement deviné l'objet : ${
              gameSessions[message.channel.id].itemName
            }.`
          );

        message.channel.send({ embeds: [embed] });
        updateScore(message.author.id, "item", 1);
        delete gameSessions[message.channel.id];
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Désolé, ce n'est pas le bon objet.")
          .setDescription("Essayez encore !");

        message.channel.send({ embeds: [embed] });
      }
    } else {
      message.channel.send(
        "Aucune session de jeu active. Utilisez `!item` pour commencer."
      );
    }
  } else {
    // Commence une nouvelle session de jeu
    const itemsData = await fetchAllItems();
    const randomItem = await selectRandomItem(itemsData);

    if (randomItem) {
      const embed = new EmbedBuilder()
        .setTitle("Quel est cet objet ?")
        .setImage(
          `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/item/${randomItem.image.full}`
        )
        .setColor(0x0099ff)
        .setDescription("Devinez le nom de cet objet !");

      message.channel.send({ embeds: [embed] });
      gameSessions[message.channel.id] = { itemName: randomItem.name };
    } else {
      message.channel.send(
        "Impossible de récupérer les informations de l'objet."
      );
    }
  }
};
