// Description: Affiche les dernières parties d'un invocateur League of Legends.
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { RIOT_API_KEY } = require("../config/config");

// Commande pour afficher l'historique des parties d'un invocateur
module.exports = async (message) => {
  const args = message.content.slice("!lolhistory".length).trim().split(" ");
  // Le premier argument après la commande est le nom d'invocateur.
  const summonerInput = args.shift();
  // Le deuxième argument est optionnel et représente le nombre de matchs à afficher.
  const numGames = Math.min(parseInt(args.shift()) || 5, 5);

  const summonerName = summonerInput.split("#")[0];

  try {
    const summonerResponse = await axios.get(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
        summonerName
      )}?api_key=${RIOT_API_KEY}`
    );
    const { puuid } = summonerResponse.data;

    const matchesResponse = await axios.get(
      `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${numGames}&api_key=${RIOT_API_KEY}`
    );
    const matches = matchesResponse.data;

    for (const matchId of matches) {
      const matchDetailsResponse = await axios.get(
        `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`
      );
      const matchDetails = matchDetailsResponse.data;

      const participantIndex =
        matchDetails.metadata.participants.indexOf(puuid);
      const participantStats = matchDetails.info.participants[participantIndex];

      const championIconUrl = `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/champion/${participantStats.championName}.png`;

      const gameDuration = Math.floor(matchDetails.info.gameDuration / 60); 
      const gameDurationStr = `${gameDuration} minutes`;

      const gameStartDate = new Date(matchDetails.info.gameCreation);
      const matchDate = gameStartDate.toLocaleDateString("fr-FR");
      const matchTime = gameStartDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const gameMode =
        {
          450: "ARAM",
          420: "Ranked Solo/Duo",
          440: "Ranked Flex",
          430: "Normal Blind",
          400: "Normal Draft",
          460: "Twisted Treeline",
          470: "Ranked Flex TT",
          900: "URF",
          1020: "One for All",
          1300: "Nexus Blitz",
        }[matchDetails.info.queueId] || "Autre";

      const embed = new EmbedBuilder()
        .setColor(participantStats.win ? 0x0397ab : 0xff0000)
        .setThumbnail(championIconUrl)
        .addFields(
          {
            name: "Champion",
            value: `${participantStats.championName}`,
            inline: true,
          },
          {
            name: "Score",
            value: `${participantStats.kills}/${participantStats.deaths}/${participantStats.assists}`,
            inline: true,
          },
          {
            name: "Résultat",
            value: participantStats.win ? "Victoire" : "Défaite",
            inline: true,
          },
          { name: "Type de jeu", value: gameMode, inline: true },
          { name: "Date", value: matchDate, inline: true },
          { name: "Durée", value: gameDurationStr, inline: true }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer l'historique des parties ou l'invocateur n'a pas été trouvé."
    );
  }
};
