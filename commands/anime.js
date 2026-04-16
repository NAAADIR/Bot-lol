const axios = require("axios");
const { updateScore } = require("./classement");
const {
  createInfoEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  getCommandArgs,
} = require("../services/gameMessageUtils");
const {
  startSession,
  getSessionForGame,
  cancelSession,
} = require("../services/gameSessionManager");
const { normalizeName } = require("../services/lolDataService");

const GAME_TYPE = "anime";
const SESSION_DURATION_MS = 1000 * 60 * 3;

async function fetchRandomCharacter() {
  const charResponse = await axios.get("https://api.jikan.moe/v4/random/characters");
  const character = charResponse.data.data;

  let titleName = "Anime/Manga inconnu";

  try {
    const charFullResponse = await axios.get(
      `https://api.jikan.moe/v4/characters/${character.mal_id}/full`
    );

    let contentId;
    let contentType;
    if (charFullResponse.data.data.anime.length > 0) {
      contentId = charFullResponse.data.data.anime[0].anime.mal_id;
      contentType = "anime";
    } else if (charFullResponse.data.data.manga.length > 0) {
      contentId = charFullResponse.data.data.manga[0].manga.mal_id;
      contentType = "manga";
    }

    if (contentId) {
      const contentResponse = await axios.get(
        `https://api.jikan.moe/v4/${contentType}/${contentId}`
      );
      titleName = contentResponse.data.data.title;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des infos anime/manga:", error);
  }

  return {
    name: character.name,
    imageUrl: character.images.jpg.image_url,
    titleName,
  };
}

async function startAnimeGame(message) {
  const character = await fetchRandomCharacter();
  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: character,
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Partie expiree",
            `Le personnage etait **${session.get("name")}** de **${session.get(
              "titleName"
            )}**.`
          ),
        ],
      });
    },
  });

  const embed = createInfoEmbed(
    "Qui est ce personnage ?",
    previousSession
      ? `L'ancienne partie a ete remplacee.\nIndice : **${character.titleName}**`
      : `Indice : **${character.titleName}**`
  );
  embed.setImage(character.imageUrl);
  await message.channel.send({ embeds: [embed] });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!anime");

  if (!input) {
    try {
      await startAnimeGame(message);
    } catch (error) {
      console.error("Erreur anime:", error);
      await message.channel.send({
        embeds: [
          createErrorEmbed(
            "Erreur",
            "Impossible de lancer une partie anime pour le moment."
          ),
        ],
      });
    }
    return;
  }

  if (["stop", "reset", "cancel", "annuler"].includes(normalizeName(input))) {
    if (normalizeName(input) === "reset") {
      await startAnimeGame(message);
      return;
    }

    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!anime` a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!anime` n'est active ici."),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startAnimeGame(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!anime` n'etait active. J'en ai lance une nouvelle, renvoie ta reponse."
        ),
      ],
    });
    return;
  }

  if (normalizeName(input) === normalizeName(session.get("name"))) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `Tu as trouve **${session.get("name")}** de **${session.get("titleName")}**.`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createErrorEmbed("Incorrect", "Ce n'est pas le bon personnage. Reessaie."),
    ],
  });
};
