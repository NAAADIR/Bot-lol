const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const openings = require("../opening.json");
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

const GAME_TYPE = "opening";
const SESSION_DURATION_MS = 1000 * 60 * 2;

async function playOpening(message, opening) {
  const voiceChannelId = message.member && message.member.voice.channelId;
  if (!voiceChannelId) {
    await message.channel.send({
      embeds: [
        createErrorEmbed(
          "Salon vocal requis",
          "Tu dois etre dans un salon vocal pour lancer `!opening`."
        ),
      ],
    });
    return;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannelId,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  const stream = ytdl(opening.audioUrl, { filter: "audioonly" });
  const resource = createAudioResource(stream);
  player.play(resource);
  connection.subscribe(player);

  const { session, previousSession } = await startSession({
    channelId: message.channel.id,
    gameType: GAME_TYPE,
    message,
    durationMs: SESSION_DURATION_MS,
    data: {
      animeName: opening.animeName,
      connection,
      player,
    },
    onExpire: async (expiredMessage, expiredSession) => {
      await expiredMessage.channel.send({
        embeds: [
          createErrorEmbed(
            "Temps ecoule",
            `L'opening etait **${expiredSession.get("animeName")}**.`
          ),
        ],
      });
    },
  });

  session.addCleanup(() => {
    try {
      player.stop(true);
    } catch (error) {
      return error;
    }
    return null;
  });
  session.addCleanup(() => {
    try {
      connection.destroy();
    } catch (error) {
      return error;
    }
    return null;
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    const activeSession = getSessionForGame(message.channel.id, GAME_TYPE);
    if (activeSession) {
      await cancelSession(message.channel.id, "expired");
      await message.channel.send({
        embeds: [
          createErrorEmbed("Fin de l'extrait", `L'opening etait **${opening.animeName}**.`),
        ],
      });
    }
  });

  await entersState(player, AudioPlayerStatus.Playing, 5000);

  await message.channel.send({
    embeds: [
      createInfoEmbed(
        "Devine l'anime de cet opening",
        previousSession
          ? "Une ancienne partie a ete arretee puis remplacee.\nReponds avec `!opening <anime>` ou stoppe avec `!opening stop`."
          : "Reponds avec `!opening <anime>` ou stoppe avec `!opening stop`."
      ),
    ],
  });
}

module.exports = async (message) => {
  const input = getCommandArgs(message, "!opening");
  const normalizedInput = normalizeName(input);

  if (!input || normalizedInput === "generate" || normalizedInput === "reset") {
    const randomIndex = Math.floor(Math.random() * openings.length);
    const selectedOpening = openings[randomIndex];
    try {
      await playOpening(message, selectedOpening);
    } catch (error) {
      console.error("Erreur opening:", error);
      await cancelSession(message.channel.id, "cancelled");
      await message.channel.send({
        embeds: [
          createErrorEmbed(
            "Lecture impossible",
            "Impossible de lire cet opening pour le moment. Essaie un autre `!opening`."
          ),
        ],
      });
    }
    return;
  }

  if (["stop", "cancel", "annuler"].includes(normalizedInput)) {
    const session = await cancelSession(message.channel.id, "cancelled");
    await message.channel.send({
      embeds: [
        session
          ? createInfoEmbed("Partie annulee", "La partie `!opening` a ete arretee.")
          : createInfoEmbed("Aucune partie", "Aucune partie `!opening` n'est active ici."),
      ],
    });
    return;
  }

  const session = getSessionForGame(message.channel.id, GAME_TYPE);
  if (!session) {
    await message.channel.send({
      embeds: [
        createInfoEmbed(
          "Aucune partie active",
          "Lance d'abord `!opening` dans un salon vocal pour commencer une partie."
        ),
      ],
    });
    return;
  }

  if (normalizedInput === normalizeName(session.get("animeName"))) {
    updateScore(message.author.id, GAME_TYPE, 1);
    await cancelSession(message.channel.id, "completed");
    await message.channel.send({
      embeds: [
        createSuccessEmbed(
          "Bonne reponse !",
          `Tu as trouve **${session.get("animeName")}**.`
        ),
      ],
    });
    return;
  }

  await message.channel.send({
    embeds: [
      createErrorEmbed("Toujours pas", "Mauvaise reponse, reessaie !"),
    ],
  });
};
