// Description: Affiche le classement de l'invocateur en Solo/Duo et Flex
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { RIOT_API_KEY } = require("../config/config");

module.exports = async (message) => {
  const args = message.content.slice("!elo".length).trim().split(" ");
  const summonerInput = args.join(" ");

  try {
    const summonerResponse = await axios.get(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerInput
      )}?api_key=${RIOT_API_KEY}`
    );

    const { id } = summonerResponse.data;

    // Obtenir les informations de classement en Solo/Duo Queue
    const rankedResponse = await axios.get(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${RIOT_API_KEY}`
    );

    let soloRank = "Non classé";
    let flexRank = "Non classé";

    rankedResponse.data.forEach((entry) => {
      if (entry.queueType === "RANKED_SOLO_5x5") {
        soloRank = `${entry.tier} ${entry.rank} (${entry.leaguePoints} LP)`;
      } else if (entry.queueType === "RANKED_FLEX_SR") {
        flexRank = `${entry.tier} ${entry.rank} (${entry.leaguePoints} LP)`;
      }
    });

    // Crée un embed pour afficher les informations de classement
    const embed = new EmbedBuilder()
      .setColor(0x0397ab)
      .setTitle(`Classement de ${summonerInput}`)
      .addFields(
        { name: "Solo/Duo", value: soloRank, inline: true },
        { name: "Flex", value: flexRank, inline: true }
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer le classement de l'invocateur ou l'invocateur n'existe pas."
    );
  }
};
