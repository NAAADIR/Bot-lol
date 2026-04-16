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
const {
  normalizeName,
  getChampionList,
  getChampionDetails,
  splashUrl,
} = require("../services/lolDataService");

const GAME_TYPE = "skins";
const SESSION_DURATION_MS = 1000 * 60 * 3;

async function startSkinsGame(message) {
  const champions = Object.values(await getChampionList());
  const champion = champions[Math.floor(Math.random() * champions.length)];
  const details = await getChampionDetails(champion.id);
  const availableSkins = details.skins.filter((skin) => skin.num !== 0);
  const skinPool = availableSkins.length ? availableSkins : details.skins;
  const skin = skinPool[Math.floor(Math.random() * skinPool.length)];

  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      championId: details.id,
      championName: details.name,
      skinName: skin.name,
    },
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Partie expiree",
            `Le champion a trouver etait **${session.get("championName")}** (${session.get(
              "skinName"
            )}).`
          ),
        ],
      });
    },
  });

  const embed = createInfoEmbed(
    "Qui est ce champion ?",
    previousSession
      ? "L'ancienne partie a ete remplacee proprement."
      : "Devinez le champion a partir de ce splash art."
  ).addFields({
    name: "Indice",
    value: `Skin: ${skin.name}`,
    inline: false,
  });

  embed.setImage(await splashUrl(details.id, skin.num));
  await message.channel.send({ embeds: [embed] });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!skins");

  if (!input) {
    await startSkinsGame(message);
    return;
  }

  if (["stop", "reset", "cancel", "annuler"].includes(normalizeName(input))) {
    if (normalizeName(input) === "reset") {
      await startSkinsGame(message);
      return;
    }

    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!skins` a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!skins` n'est active ici."),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startSkinsGame(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!skins` n'etait active. J'en ai lance une nouvelle, renvoie ta reponse."
        ),
      ],
    });
    return;
  }

  if (normalizeName(input) === normalizeName(session.get("championName"))) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `C'etait **${session.get("championName")}**, skin **${session.get(
            "skinName"
          )}**.`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createErrorEmbed(
        "Pas encore",
        "Ce n'est pas le bon champion. Reessaie ou utilise `!skins reset`."
      ),
    ],
  });
};
