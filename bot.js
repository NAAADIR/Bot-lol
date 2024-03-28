const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { DISCORD_BOT_TOKEN } = require("./config/config");
const lolhistory = require("./commands/lolhistory");
const elo = require("./commands/elo");
const champ = require("./commands/champ");
const rotation = require("./commands/rotation");
const compare = require("./commands/compare");
const ranked = require("./commands/ranked");
const guest = require("./commands/guest");
const skills = require("./commands/skills");
const skins = require("./commands/skins");
const anime = require("./commands/anime");
const opening = require("./commands/opening");
const item = require("./commands/item");
const gold = require("./commands/gold");
const infoitem = require("./commands/infoitem");
const inforune = require("./commands/inforune");
const { showRanking } = require("./commands/classement");

// Crée une instance du client Discord
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

// Événement déclenché lorsque le bot est prêt / Ajout d'une commande pour lancer un message toutes les 29 minutes pour éviter l'inactive du bot (plan hébergement gratuit)
client.once("ready", () => {
  console.log("Le bot est prêt !");

  setInterval(() => {
    const channel = client.channels.cache.get("1219777966754758747");
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Nadir Bot")
        .setDescription(
          "Salem les freres, je suis le bot de Nadir. Je dois envoyer un message toutes les 29 minutes pour que mon bot soit connecté car je suis héberger dans un serveur gratuitement. Passez une bonne journée !"
        )
        .setFooter({
          text: "Tapez !help pour voir la liste des commandes disponibles.",
        });

      channel.send({ embeds: [embed] }).catch(console.error);
    } else {
      console.log("Impossible de trouver le canal.");
    }
  }, 1740000);
});

// Événement déclenché lorsqu'un message est envoyé dans un salon
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
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
            "Affiche le classement pour un jeu spécifique. GameType: skins, skills, guest, opening.",
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
    if (message.author.bot) return;
    const guessedName = message.content.split(" ")[1];
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
  }
});

client.login(DISCORD_BOT_TOKEN);
