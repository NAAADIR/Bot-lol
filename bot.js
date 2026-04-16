const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID } = require("./config/config");
const lolhistory = require("./commands/lolhistory");
const elo = require("./commands/elo");
const champ = require("./commands/champ");
const rotation = require("./commands/rotation");
const compare = require("./commands/compare");
const ranked = require("./commands/ranked");
const guest = require("./commands/guest");
const valostats = require("./commands/valostats");
const skills = require("./commands/skills");
const valoskins = require("./commands/valoskins");
const valomap = require("./commands/valomap");

const valohistory = require("./commands/valohistory");

const skins = require("./commands/skins");
const anime = require("./commands/anime");
const opening = require("./commands/opening");
const item = require("./commands/item");
const gold = require("./commands/gold");
const infoitem = require("./commands/infoitem");
const inforune = require("./commands/inforune");
const daily = require("./commands/daily");
const profile = require("./commands/profile");
const regionquiz = require("./commands/regionquiz");
const { showRanking } = require("./commands/classement");
const { cancelSession, getSession } = require("./services/gameSessionManager");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

const startNewsWatcher = require("./services/newsWatcher");

const valorantPlayers = new Set();

client.once("ready", () => {
  console.log("Le bot est prêt !");
  // Démarre le watcher des news LoLEsports
  try {
    startNewsWatcher(client);
  } catch (err) {
    console.error("Erreur lors du démarrage du newsWatcher:", err);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
    if (message.content === "!help") {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Liste des commandes disponibles")
      .addFields(
        {
          name: "!lolhistory <ID>",
          value: "Donne l’historique LoL d’un joueur. (max 5)",
        },
        {
          name: "!lolhistory <ID> <chiffre>",
          value: "Donne l’historique LoL d’un joueur avec le chiffre indiqué.",
        },
        { name: "!elo <ID>", value: "Affiche le classement Elo d’un joueur." },
        {
          name: "!champ <champion>",
          value: "Informations sur un champion spécifique.",
        },
        {
          name: "!rotation",
          value: "Montre la rotation actuelle des champions gratuits.",
        },
        {
          name: "!compare <ID1> <ID2>",
          value: "Compare les statistiques de deux joueurs.",
        },
        {
          name: "!ranked <division> <tier>",
          value: "Affiche le classement des joueurs. Exemple : !ranked gold II",
        },
        {
          name: "!guest",
          value: "Démarre un jeu de devinettes sur les champions.",
        },
        {
          name: "!skills",
          value:
            "Démarre un jeu pour deviner un champion à partir de ses compétences.",
        },
        {
          name: "!skins",
          value:
            "Démarre un jeu pour deviner le champion à partir de ses skins.",
        },
        {
          name: "!classement <gameType>",
          value:
            "Affiche le classement pour un jeu spécifique. GameType: skins, skills, guest, opening, item, gold, anime, regionquiz.",
        },
        {
          name: "!opening",
          value:
            "Lance un opening dans un canal et il faut deviner l'opening avec !openinng + nom de l'anime",
        },
        {
          name: "!item",
          value:
            "Démarre un jeu pour deviner le nom de l'item à partir de son image",
        },
        {
          name: "!gold",
          value: "Démarre un jeu pour deviner le prix d'un item en pièces d'or",
        },
        {
          name: "!infoitem <nom>",
          value:
            "Affiche les informations sur un item spécifique. Exemple : !infoitem Doran's Blade",
        },
        {
          name: "!inforune <nom>",
          value:
            "Affiche les informations sur une rune spécifique. Exemple : !inforune Conqueror",
        },
        {
          name: "!regionquiz",
          value: "Démarre un quiz pour deviner la région d'un champion.",
        },
        {
          name: "!daily",
          value: "Affiche le champion LoL du jour et un défi fun.",
        },
        {
          name: "!profile [@user]",
          value: "Affiche le profil mini-jeux d'un joueur Discord.",
        },
        {
          name: "!cancel",
          value: "Annule la partie interactive active dans le salon.",
        },
        { name: "!ping", value: "Vérifie si le bot est en ligne." },
        { name: "!help", value: "Affiche ce message d’aide." }
      )
      .setFooter({
        text: "Tapez ! suivi du nom de la commande pour l’utiliser.",
      });

    message.channel.send({ embeds: [embed] });
  } else if (message.content.startsWith("!lolhistory")) {
    await lolhistory(message);
  } else if (message.content.startsWith("!elo")) {
    await elo(message);
  } else if (message.content.startsWith("!champ")) {
    await champ(message);
  } else if (message.content.startsWith("!rotation")) {
    await rotation(message);
  } else if (message.content === "!ping") {
    await message.channel.send("Pong !");
  } else if (message.content.startsWith("!compare")) {
    await compare(message);
  } else if (message.content.startsWith("!ranked")) {
    await ranked(message);
  } else if (message.content.startsWith("!guest")) {
    const guessedName = message.content.slice("!guest".length).trim();
    await guest(message, guessedName);
  } else if (message.content.startsWith("!skills")) {
    await skills(message);
  } else if (message.content.startsWith("!skins")) {
    await skins(message);
  } else if (message.content.startsWith("!classement")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      message.channel.send("Usage: !classement [gameType]");
      return;
    }
    const gameType = args[1];
    showRanking(message, gameType);
  } else if (message.content.startsWith("!anime")) {
    await anime(message);
  } else if (message.content.startsWith("!opening")) {
    await opening(message);
  } else if (message.content.startsWith("!item")) {
    await item(message);
  } else if (message.content.startsWith("!gold")) {
    await gold(message);
  } else if (message.content.startsWith("!infoitem")) {
    await infoitem(message);
  } else if (message.content.startsWith("!inforune")) {
    await inforune(message);
  } else if (message.content.startsWith("!valohistory")) {
    await valohistory(message);
  } else if (message.content.startsWith("!valostats")) {
    await valostats(message);
  } else if (message.content.startsWith("!valoskins")) {
    await valoskins(message);
  } else if (message.content.startsWith("!valomap")) {
    await valomap(message);
  } else if (message.content.startsWith("!profile")) {
    await profile(message);
  } else if (message.content.startsWith("!daily")) {
    await daily(message);
  } else if (message.content.startsWith("!regionquiz")) {
    await regionquiz(message);
  } else if (message.content === "!cancel") {
    const activeSession = getSession(message.channel.id);
    if (!activeSession) {
      await message.channel.send("Aucune partie interactive n'est en cours dans ce salon.");
      return;
    }

    await cancelSession(message.channel.id, "cancelled");
    await message.channel.send(
      `La partie \`${activeSession.gameType}\` a été annulée proprement.`
    );
  }
  } catch (error) {
    console.error("Erreur lors du traitement d'une commande:", error);
    await message.channel.send(
      "Une erreur est survenue pendant l'exécution de la commande."
    );
  }
});

// 🎮 Détection de lancement de Valorant sans spam
client.on("presenceUpdate", (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.user || !newPresence.activities) return;

  const userId = newPresence.userId || newPresence.user.id;

  const isPlayingValorant = newPresence.activities.some(
    (activity) =>
      activity.type === 0 && activity.name?.toLowerCase() === "valorant"
  );

  if (isPlayingValorant && !valorantPlayers.has(userId)) {
    valorantPlayers.add(userId);

    const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xff4655)
        .setDescription(
          `🕹️ **${newPresence.user.username}** vient de lancer **Valorant** ! 🔫`
        )
        .setTimestamp()
        .setFooter({
          text: "LeagueBot",
          iconURL: client.user.displayAvatarURL(),
        });

      channel.send({ embeds: [embed] });
    }
  }

  if (!isPlayingValorant && valorantPlayers.has(userId)) {
    valorantPlayers.delete(userId);
  }
});

const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is alive!\n");
  })
  .listen(process.env.PORT || 3000);

client.login(DISCORD_BOT_TOKEN);
