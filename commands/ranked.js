const axios = require("axios");
const { RIOT_API_KEY } = require("../config/config");
const { EmbedBuilder } = require("discord.js");

module.exports = async (message) => {
  const args = message.content.slice("!ranked".length).trim().split(" ");
  // Par exemple: GOLD, CHALLENGER
  const tierInput = args[0].toUpperCase();
  // Par exemple: I, II (Optionnel pour CHALLENGER)
  const divisionInput = args[1] ? args[1].toUpperCase() : "";

  // La queue type pour laquelle afficher les classements. Exemple: RANKED_SOLO_5x5
  const queueType = "RANKED_SOLO_5x5";

  try {
    const rankedResponse = await axios.get(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/${queueType}/${tierInput}/${divisionInput}?api_key=${RIOT_API_KEY}`
    );

    let response = "";
    rankedResponse.data.forEach((entry, index) => {
      // Limite le nombre de résultats pour ne pas dépasser la limite des caractères dans une réponse Discord
      if (index < 10) {
        response += `${entry.summonerName} : ${entry.tier} ${entry.rank} (${entry.leaguePoints} LP)\n`;
      }
    });

    const embed = new EmbedBuilder()
      .setColor(0x0397ab)
      .setTitle(`Classement ${tierInput} ${divisionInput}`)
      .setDescription(response || "Aucune donnée disponible.")
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.channel.send("Impossible de récupérer le classement demandé.");
  }
};
