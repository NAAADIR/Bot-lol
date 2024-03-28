const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
let currentCharacter = {}; // Pour stocker l'info du personnage courant

async function getRandomCharacter() {
  try {
    const charResponse = await axios.get(
      "https://api.jikan.moe/v4/random/characters"
    );
    const character = charResponse.data.data;

    let titleName = "Anime/Manga inconnu"; // Valeur par défaut

    try {
      const charFullResponse = await axios.get(
        `https://api.jikan.moe/v4/characters/${character.mal_id}/full`
      );
      console.log("charFullResponse", charFullResponse.data.data);

      // Détermine si le personnage est principalement associé à un anime ou un manga
      // et extraire le premier ID disponible
      let contentId;
      let contentType;
      if (charFullResponse.data.data.anime.length > 0) {
        contentId = charFullResponse.data.data.anime[0].anime.mal_id; 
        contentType = "anime";
      } else if (charFullResponse.data.data.manga.length > 0) {
        contentId = charFullResponse.data.data.manga[0].manga.mal_id; 
        contentType = "manga";
      }

      // Utilise l'ID extrait pour obtenir des informations sur l'anime ou le manga
      if (contentId) {
        const contentResponse = await axios.get(
          `https://api.jikan.moe/v4/${contentType}/${contentId}`
        );
        titleName = contentResponse.data.data.title; // Nom de l'anime ou du manga
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations de l'anime/manga :",
        error
      );
    }

    currentCharacter = {
      name: character.name,
      imageUrl: character.images.jpg.image_url,
      titleName: titleName, // Nom de l'anime ou du manga
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données du personnage :",
      error
    );
    currentCharacter = {};
  }
}

module.exports = async (message) => {
  const args = message.content.split(" ");
  const command = args[0];
  const guess = args.slice(1).join(" ").trim();

  if (command === "!anime" && guess.toLowerCase() === "stop") {
    // Arrêter la session en cours
    currentCharacter = {};
    message.channel.send("Session de devinette arrêtée.");
  } else if (command === "!anime" && !guess) {
    await getRandomCharacter();
    if (currentCharacter.name) {
      const embed = new EmbedBuilder()
        .setTitle("Qui est ce personnage de manga ?")
        .setDescription(
          `Indice : Ce personnage est de "${currentCharacter.titleName}".`
        )
        .setImage(currentCharacter.imageUrl)
        .setColor(0x0099ff);
      await message.channel.send({ embeds: [embed] });
    } else {
      message.channel.send(
        "Désolé, je ne peux pas récupérer un personnage en ce moment. Essayez à nouveau plus tard."
      );
    }
  } else if (command === "!anime") {
    if (guess.toLowerCase() === currentCharacter.name.toLowerCase()) {
      message.reply(
        `Félicitations ! Vous avez deviné correctement : ${currentCharacter.name}.`
      );
      currentCharacter = {};
    } else {
      message.reply("Ce n'est pas correct. Essayez encore !");
    }
  }
};
