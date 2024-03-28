const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

let goldSessions = {};

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

// Fonction pour sélectionner un objet aléatoire
async function selectRandomItem(itemsData) {
  const itemKeys = Object.keys(itemsData).filter(
    (key) => itemsData[key].gold && !itemsData[key].hideFromAll
  );
  const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
  return itemsData[randomKey];
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);

  if (args[0] === "stop") {
    if (goldSessions[message.channel.id]) {
      delete goldSessions[message.channel.id];
      const embed = new EmbedBuilder()
        .setTitle("Session arrêtée")
        .setDescription("La session de jeu a été arrêtée.")
        .setColor(0x0099ff);
      message.channel.send({ embeds: [embed] });
    } else {
      message.channel.send("Aucune session de jeu en cours.");
    }
  } else if (args[0] === "reset" || !goldSessions[message.channel.id]) {
    // Gère le reset ou démarrer une nouvelle session si aucune n'est active
    const itemsData = await fetchAllItems();
    const randomItem = await selectRandomItem(itemsData);

    if (randomItem) {
      const embed = new EmbedBuilder()
        .setTitle(randomItem.name)
        .setImage(
          `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/item/${randomItem.image.full}`
        )
        .setColor(0x0099ff)
        .setDescription("Devinez le prix de cet objet en pièces d'or !");

      message.channel.send({ embeds: [embed] });
      goldSessions[message.channel.id] = { itemPrice: randomItem.gold.total };
    } else {
      message.channel.send(
        "Impossible de récupérer les informations de l'objet."
      );
    }
  } else if (args.length > 0) {
    // Vérifie les réponses des utilisateurs
    const guess = parseInt(args[0], 10);
    if (isNaN(guess)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Erreur")
        .setDescription("Veuillez entrer un nombre valide.");
      message.channel.send({ embeds: [embed] });
      return;
    }

    const correctPrice = goldSessions[message.channel.id]?.itemPrice;

    if (guess === correctPrice) {
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Félicitations !")
        .setDescription(
          `Vous avez correctement deviné le prix de l'objet : ${correctPrice} pièces d'or.`
        );

      message.channel.send({ embeds: [embed] });
      updateScore(message.author.id, "gold", 1);
      delete goldSessions[message.channel.id];
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Mauvaise réponse")
        .setDescription(`Essayez encore ! Le prix correct n'est pas ${guess}.`);
      message.channel.send({ embeds: [embed] });
    }
  }
};
