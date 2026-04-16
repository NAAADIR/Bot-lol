const championsData = require("../champion.json");
const { updateScore } = require("./classement");
const {
  createInfoEmbed,
  createSuccessEmbed,
  createErrorEmbed,
} = require("../services/gameMessageUtils");
const {
  startSession,
  getSessionForGame,
  cancelSession,
} = require("../services/gameSessionManager");
const {
  normalizeName,
  championSquareUrl,
} = require("../services/lolDataService");

const GAME_TYPE = "guest";
const SESSION_DURATION_MS = 1000 * 60 * 5;

function randomChampion() {
  return championsData[Math.floor(Math.random() * championsData.length)];
}

function getChampionHints(guess, target) {
  return {
    Genre: {
      result: guess.genre === target.genre ? "✅" : "❌",
      value: guess.genre,
    },
    Role: {
      result: guess.role === target.role ? "✅" : "❌",
      value: guess.role,
    },
    Espece: {
      result: guess.species === target.species ? "✅" : "❌",
      value: guess.species,
    },
    Ressource: {
      result: guess.resource === target.resource ? "✅" : "❌",
      value: guess.resource,
    },
    Portee: {
      result: guess.rangeType === target.rangeType ? "✅" : "❌",
      value: guess.rangeType,
    },
    Region: {
      result: guess.region === target.region ? "✅" : "❌",
      value: guess.region,
    },
    Sortie: (() => {
      if (guess.releaseYear === target.releaseYear) {
        return { result: "✅", value: `En ${target.releaseYear}` };
      }
      if (guess.releaseYear < target.releaseYear) {
        return { result: "🔼", value: `Apres ${guess.releaseYear}` };
      }
      return { result: "🔽", value: `Avant ${guess.releaseYear}` };
    })(),
  };
}

async function startGuestGame(message) {
  const { previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      targetChampion: randomChampion(),
      attempts: 0,
    },
    onExpire: async (expiredMessage, session) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Temps ecoule",
            `La partie \`!guest\` a expire. Le champion etait **${session.get(
              "targetChampion"
            ).name}**.`
          ),
        ],
      });
    },
  });

  await message.channel.send({
    embeds: [
      createInfoEmbed(
        "Nouvelle partie !guest",
        previousSession
          ? "Une ancienne partie a ete annulee puis remplacee proprement.\nDevinez avec `!guest <nom>` ou arretez avec `!guest stop`."
          : "Devinez le champion avec `!guest <nom>`.\nChaque essai donne des indices sur le role, la region, la ressource et l'annee."
      ),
    ],
  });
}

async function processGuess(message, guessedName) {
  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await startGuestGame(message);
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Partie demarree",
          "Aucune partie `!guest` n'etait en cours. J'en ai lance une nouvelle, renvoie ta proposition."
        ),
      ],
    });
    return;
  }

  const targetChampion = session.get("targetChampion");
  const guessedChampion = championsData.find(
    (champion) => normalizeName(champion.name) === normalizeName(guessedName)
  );

  if (!guessedChampion) {
    await message.channel.send({
      embeds: [
        createErrorEmbed(
          "Champion introuvable",
          "Le champion propose n'a pas ete reconnu. Verifie l'orthographe et reessaie."
        ),
      ],
    });
    return;
  }

  session.set("attempts", session.get("attempts") + 1);

  const embed = createInfoEmbed(
    `Indices pour ${guessedChampion.name}`,
    "Voici le resultat de ta tentative."
  );
  const thumbnailUrl = await championSquareUrl(guessedChampion.name);
  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }

  Object.entries(getChampionHints(guessedChampion, targetChampion)).forEach(
    ([key, { result, value }]) => {
      embed.addFields({
        name: `${key} ${result}`,
        value: String(value),
        inline: true,
      });
    }
  );

  await message.channel.send({ embeds: [embed] });

  if (normalizeName(guessedChampion.name) === normalizeName(targetChampion.name)) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bien joue !",
          `Tu as trouve **${targetChampion.name}** en ${session.get(
            "attempts"
          )} tentative(s).`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createInfoEmbed(
        "Ce n'est pas encore ca",
        "Continue avec un autre champion ou annule la partie avec `!guest stop`."
      ),
    ],
  });
}

module.exports = async function guest(message, guessedName) {
  const input = String(guessedName || "").trim();

  if (!input) {
    await startGuestGame(message);
    return;
  }

  if (["stop", "cancel", "annuler"].includes(normalizeName(input))) {
    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!guest` en cours a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!guest` n'est active dans ce salon."),
      ],
    });
    return;
  }

  await processGuess(message, input);
};
