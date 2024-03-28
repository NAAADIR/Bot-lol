// Description : Compare deux invocateurs en stats générales
const axios = require("axios");
const { RIOT_API_KEY } = require("../config/config");
const { EmbedBuilder } = require("discord.js");

module.exports = async (message) => {
  const args = message.content.slice("!compare".length).trim().split(" ");
  const summonerInput1 = args[0];
  const summonerInput2 = args[1];

  try {
    const summonerResponse1 = await axios.get(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerInput1
      )}?api_key=${RIOT_API_KEY}`
    );
    const summonerResponse2 = await axios.get(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerInput2
      )}?api_key=${RIOT_API_KEY}`
    );

    const { id: id1, name: name1 } = summonerResponse1.data;
    const { id: id2, name: name2 } = summonerResponse2.data;

    const summonerStats1 = await getSummonerStats(id1);
    const summonerStats2 = await getSummonerStats(id2);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Comparaison des Invocateurs`)
      .addFields(
        { name: name1, value: summonerStats1, inline: true },
        { name: name2, value: summonerStats2, inline: true }
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer les informations des invocateurs."
    );
  }
};

// Récupère les statistiques de l'invocateur
async function getSummonerStats(id) {
  try {
    const response = await axios.get(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${RIOT_API_KEY}`
    );

    const statsEntries = response.data;

    // Trouve les entrées pour Solo/Duo et ARAM (si disponible)
    const soloDuoEntry = statsEntries.find(
      (entry) => entry.queueType === "RANKED_SOLO_5x5"
    );
    const aramEntry = statsEntries.find(
      (entry) => entry.queueType === "ARAM" || entry.queueType === "RANKED_ARAM"
    ); 

    let stats = "";

    if (soloDuoEntry) {
      const totalGamesSoloDuo = soloDuoEntry.wins + soloDuoEntry.losses;
      const winRateSoloDuo = (
        (soloDuoEntry.wins / totalGamesSoloDuo) *
        100
      ).toFixed(2);
      stats += `Solo/Duo: ${soloDuoEntry.tier} ${soloDuoEntry.rank} (${soloDuoEntry.leaguePoints} LP)\nTaux de Victoire: ${winRateSoloDuo}% (${soloDuoEntry.wins}W-${soloDuoEntry.losses}L)\n`;
    }

    if (aramEntry) {
      const totalGamesAram = aramEntry.wins + aramEntry.losses;
      const winRateAram = ((aramEntry.wins / totalGamesAram) * 100).toFixed(2);
      stats += `\nARAM\nTaux de Victoire: ${winRateAram}% (${aramEntry.wins}W-${aramEntry.losses}L)`;
    }

    return stats || "Non classé";
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des informations de l'invocateur ${id}:`,
      error
    );
    return "Erreur lors de la récupération des données";
  }
}
