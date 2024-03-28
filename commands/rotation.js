const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { RIOT_API_KEY } = require("../config/config");

// La fonction principale qui traite la commande !rotation
module.exports = async (message) => {
  try {
    const rotationResponse = await axios.get(
      `https://euw1.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${RIOT_API_KEY}`
    );
    const rotationData = rotationResponse.data;

    // Récupère les noms des champions en utilisant leurs ID
    const championNames = await getChampionNamesByIds(
      rotationData.freeChampionIds
    );

    // Crée un embed pour afficher les noms des champions et leur icon
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Rotation des Champions Gratuits`)
      .setDescription(championNames.join("\n"))
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer la rotation des champions gratuits."
    );
  }
};

// Fonction pour récupérer les noms des champions à partir de leurs ID
async function getChampionNamesByIds(ids) {
  try {
    const response = await axios.get(
      "https://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion.json"
    );
    const champions = response.data.data;

    // Création d'un map d'ID à nom pour tous les champions
    const idToNameMap = {};
    Object.values(champions).forEach((champ) => {
      idToNameMap[champ.key] = champ.name;
    });

    // Filtre les noms des champions basés sur les ID fournis
    const championNames = ids.map(
      (id) => idToNameMap[id.toString()] || `Inconnu (${id})`
    );
    return championNames;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données des champions :",
      error
    );
    return ids.map((id) => `Inconnu (${id})`);
  }
}
