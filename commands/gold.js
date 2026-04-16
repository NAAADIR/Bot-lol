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

const GAME_TYPE = "gold";
const SESSION_DURATION_MS = 1000 * 60 * 3;

async function startGoldGame(message) {
  const items = Object.values(await getItems()).filter(
    (item) => item.gold && item.gold.total > 0 && !item.hideFromAll
  );
  const item = items[Math.floor(Math.random() * items.length)];

  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      itemName: item.name,
      itemPrice: item.gold.total,
    },
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Partie expiree",
            `Le prix de **${session.get("itemName")}** etait **${session.get(
              "itemPrice"
            )} PO**.`
          ),
        ],
      });
    },
  });

  const embed = createInfoEmbed(
    `Combien coute ${item.name} ?`,
    previousSession
      ? "L'ancienne partie a ete remplacee proprement."
      : "Devinez le prix total de l'objet en pieces d'or avec `!gold <nombre>`."
  );
  embed.setImage(await itemImageUrl(item.image.full));
  await message.channel.send({ embeds: [embed] });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!gold");

  if (!input) {
    await startGoldGame(message);
    return;
  }

  if (["stop", "reset", "cancel", "annuler"].includes(normalizeName(input))) {
    if (normalizeName(input) === "reset") {
      await startGoldGame(message);
      return;
    }

    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!gold` a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!gold` n'est active ici."),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startGoldGame(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!gold` n'etait active. J'en ai lance une nouvelle, renvoie ta reponse."
        ),
      ],
    });
    return;
  }

  const guess = Number.parseInt(input, 10);
  if (Number.isNaN(guess)) {
    await message.channel.send({
      embeds: [
        createErrorEmbed("Valeur invalide", "Entre un nombre valide en pieces d'or."),
      ],
    });
    return;
  }

  if (guess === session.get("itemPrice")) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `**${session.get("itemName")}** coute bien **${session.get("itemPrice")} PO**.`
        ),
      ],
    });
    return;
  }

  const hint = guess < session.get("itemPrice") ? "plus" : "moins";
  await message.channel.send({
    embeds: [
      createErrorEmbed("Toujours pas", `Ce n'est pas correct. Le prix est ${hint} eleve.`),
    ],
  });
};
