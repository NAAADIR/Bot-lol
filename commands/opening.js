const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const openings = require("../opening.json");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

let openingSession = null;

function normalizeName(name) {
  return name.replace(/\s+/g, "").toLowerCase();
}

// Fonction pour jouer un opening
async function playOpening(message, opening) {
  const voiceChannelId = message.member.voice.channelId;
  if (!voiceChannelId) {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Erreur")
          .setDescription(
            "Vous devez être dans un channel vocal pour utiliser cette commande."
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

  openingSession = { animeName: opening.animeName, connection, player };

  await entersState(player, AudioPlayerStatus.Playing, 5e3);
  message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Devinez l'anime de cet opening!"),
    ],
  });

  player.on(AudioPlayerStatus.Idle, () => {
    if (openingSession) {
      openingSession.connection.destroy();
      openingSession = null;
    }
  });
}

module.exports = async (message) => {
  const args = message.content.split(" ");
  const command = args[0].toLowerCase();
  const additionalCommand = args[1] ? args[1].toLowerCase() : "";

  if (additionalCommand === "stop" && openingSession) {
    openingSession.connection.destroy();
    openingSession = null;
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("L'ouverture a été arrêtée."),
      ],
    });
  } else if (additionalCommand === "generate") {
    if (openingSession) {
      openingSession.connection.destroy();
    }
    const randomIndex = Math.floor(Math.random() * openings.length);
    const selectedOpening = openings[randomIndex];
    await playOpening(message, selectedOpening);
  } else if (command === "!opening" && args.length > 1) {
    const guess = normalizeName(args.slice(1).join(" "));
    if (openingSession && guess === normalizeName(openingSession.animeName)) {
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Félicitations !")
            .setDescription("Vous avez trouvé le bon anime."),
        ],
      });
      // Mise à jour du score de l'utilisateur
      updateScore(message.author.id, "opening", 1);
      openingSession.connection.destroy();
      openingSession = null;
    } else {
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Essai encore")
            .setDescription("Mauvaise réponse, essayez encore !"),
        ],
      });
    }
  } else if (command === "!opening") {
    const randomIndex = Math.floor(Math.random() * openings.length);
    const selectedOpening = openings[randomIndex];
    await playOpening(message, selectedOpening);
  }
};
