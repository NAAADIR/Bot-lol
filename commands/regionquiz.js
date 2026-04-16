const championsData = require("../champion.json");
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
const { normalizeName, championSquareUrl } = require("../services/lolDataService");

const GAME_TYPE = "regionquiz";
const SESSION_DURATION_MS = 1000 * 60 * 2;

function pickChampion() {
  return championsData[Math.floor(Math.random() * championsData.length)];
}

async function startRegionQuiz(message) {
  const champion = pickChampion();
  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      championName: champion.name,
      region: champion.region,
    },
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Partie expiree",
            `La bonne reponse etait **${session.get("region")}** pour **${session.get(
              "championName"
            )}**.`
          ),
        ],
      });
    },
  });

  const embed = createInfoEmbed(
    "Region Quiz",
    previousSession
      ? "L'ancienne partie a ete remplacee.\nDe quelle region vient ce champion ?"
      : "De quelle region vient ce champion ?"
  ).addFields({
    name: "Champion",
    value: champion.name,
    inline: false,
  });

  const thumbnailUrl = await championSquareUrl(champion.name);
  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }

  await message.channel.send({ embeds: [embed] });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!regionquiz");

  if (!input) {
    await startRegionQuiz(message);
    return;
  }

  if (["stop", "reset", "cancel", "annuler"].includes(normalizeName(input))) {
    if (normalizeName(input) === "reset") {
      await startRegionQuiz(message);
      return;
    }

    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!regionquiz` a ete arretee.")
          : createInfoEmbed(
              "Aucune partie",
              "Aucune partie `!regionquiz` n'est active ici."
            ),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startRegionQuiz(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!regionquiz` n'etait active. J'en ai lance une nouvelle, renvoie ta reponse."
        ),
      ],
    });
    return;
  }

  if (normalizeName(input) === normalizeName(session.get("region"))) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `**${session.get("championName")}** vient bien de **${session.get("region")}**.`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createErrorEmbed("Incorrect", "Ce n'est pas la bonne region. Reessaie."),
    ],
  });
};
