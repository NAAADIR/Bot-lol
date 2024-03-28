const championsData = require("../champion.json");
const { EmbedBuilder } = require("discord.js");
const { updateScore } = require("./classement");

// Stockage en mémoire des sessions de jeu, indexé par ID de canal ou d'utilisateur
const gameSessions = {};

// Fonction pour normaliser les noms de champions pour la correspondance
function normalizeName(name) {
  return name.replace(/\s+/g, "").toLowerCase();
}

// Fonction pour initialiser ou récupérer une session de jeu
function getGameSession(channelId) {
  if (!gameSessions[channelId]) {
    // Initialisation avec un champion aléatoire si la session n'existe pas
    gameSessions[channelId] = {
      targetChampion:
        championsData[Math.floor(Math.random() * championsData.length)],
    };
  }
  return gameSessions[channelId];
}

// Fonction pour générer des indices basés sur la devinette et le champion cible
function getChampionHints(guess, target) {
  let hints = {};

  // Inclure à la fois le résultat de la comparaison et la valeur réelle pour chaque catégorie
  hints.genre = {
    result: guess.genre === target.genre ? "✅" : "❌",
    value: guess.genre,
  };
  hints.role = {
    result: guess.role === target.role ? "✅" : "❌",
    value: guess.role,
  };
  hints.race = {
    result: guess.species === target.species ? "✅" : "❌",
    value: guess.species,
  };
  hints.resource = {
    result: guess.resource === target.resource ? "✅" : "❌",
    value: guess.resource,
  };
  hints.rangeType = {
    result: guess.rangeType === target.rangeType ? "✅" : "❌",
    value: guess.rangeType,
  };
  hints.region = {
    result: guess.region === target.region ? "✅" : "❌",
    value: guess.region,
  };

  if (guess.releaseYear === target.releaseYear) {
    hints.releaseYear = { result: "✅", value: `En ${target.releaseYear}` };
  } else if (guess.releaseYear < target.releaseYear) {
    hints.releaseYear = { result: "🔼", value: `Après ${guess.releaseYear}` };
  } else {
    hints.releaseYear = { result: "🔽", value: `Avant ${guess.releaseYear}` };
  }

  return hints;
}

// Traitement d'une devinette
async function processGuess(message, guessedName) {
  const session = getGameSession(message.channel.id);
  const targetChampion = session.targetChampion;

  const guessedChampion = championsData.find(
    (champ) => normalizeName(champ.name) === normalizeName(guessedName)
  );

  if (!guessedChampion) {
    return message.channel.send("Champion introuvable. Essayez à nouveau.");
  }

  const hints = getChampionHints(guessedChampion, targetChampion);

  const embed = new EmbedBuilder()
    .setTitle(`Informations pour ${guessedChampion.name}`)
    .setDescription("Voici les indices basés sur votre devinette :")
    .setColor(0x0099ff)
    .setThumbnail(
      `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/champion/${guessedChampion.name}.png`
    );

  Object.entries(hints).forEach(([key, { result, value }]) => {
    embed.addFields({
      name: `${key.charAt(0).toUpperCase() + key.slice(1)}: ${result}`,
      value: value.toString(),
      inline: true,
    });
  });

  message.channel.send({ embeds: [embed] });

  if (
    normalizeName(guessedChampion.name) === normalizeName(targetChampion.name)
  ) {
    // Mettre le message dans un Embed pour une meilleure présentation
    const embed = new EmbedBuilder()
      .setTitle(`Félicitations !`)
      .setDescription(`Vous avez deviné le champion.`)
      .setColor(0x0099ff);

    try {
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'embed :", error);
    }
    // Mettre à jour le score de l'utilisateur
    updateScore(message.author.id, "guest", 1);
    delete gameSessions[message.channel.id];
  } else {
    message.channel.send(
      "Pas tout à fait correct. Essayez avec un autre champion !"
    );
  }
}

// Ajout du traitement de la commande stop
function stopGameSession(channelId) {
  if (gameSessions[channelId]) {
    delete gameSessions[channelId];
    return true;
  }
  return false;
}

module.exports = async function guest(message, guessedName) {
  // Si la commande est "!guest stop", arrête la session de jeu
  if (guessedName === "stop") {
    const sessionStopped = stopGameSession(message.channel.id);
    if (sessionStopped) {
      return message.channel.send("La partie en cours a été stoppée.");
    } else {
      return message.channel.send("Aucune partie en cours à stopper.");
    }
  }

  // Traitement de la devinette si pas la commande stop
  if (!guessedName) {
    return message.channel.send("Veuillez spécifier un champion à deviner.");
  }
  await processGuess(message, guessedName);
};
