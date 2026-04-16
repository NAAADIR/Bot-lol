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
const { normalizeName, getItems, itemImageUrl } = require("../services/lolDataService");

const GAME_TYPE = "item";
const SESSION_DURATION_MS = 1000 * 60 * 3;

async function startItemGame(message) {
  const items = Object.values(await getItems()).filter(
    (item) => item.name && item.gold && !item.hideFromAll
  );
  const item = items[Math.floor(Math.random() * items.length)];

  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      itemName: item.name,
    },
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Partie expiree",
            `L'objet a trouver etait **${session.get("itemName")}**.`
          ),
        ],
      });
    },
  });

  const embed = createInfoEmbed(
    "Quel est cet objet ?",
    previousSession
      ? "L'ancienne partie a ete remplacee proprement."
      : "Devinez le nom de cet objet avec `!item <nom>`."
  );
  embed.setImage(await itemImageUrl(item.image.full));
  await message.channel.send({ embeds: [embed] });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!item");

  if (!input) {
    await startItemGame(message);
    return;
  }

  if (["stop", "reset", "cancel", "annuler"].includes(normalizeName(input))) {
    if (normalizeName(input) === "reset") {
      await startItemGame(message);
      return;
    }

    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!item` a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!item` n'est active ici."),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startItemGame(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!item` n'etait active. J'en ai lance une nouvelle, renvoie ta reponse."
        ),
      ],
    });
    return;
  }

  if (normalizeName(input) === normalizeName(session.get("itemName"))) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `Tu as correctement trouve **${session.get("itemName")}**.`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createErrorEmbed("Incorrect", "Ce n'est pas le bon objet. Reessaie."),
    ],
  });
};
