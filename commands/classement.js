const sqlite3 = require("sqlite3").verbose();
const { EmbedBuilder } = require("discord.js");

// Crée ou ouvre la base de données
let db = new sqlite3.Database(
  "./gameScores.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error("Erreur lors de la connexion à la base de données", err);
    } else {
      console.log(
        "Connecté à la base de données SQLite pour les scores de jeu."
      );
    }
  }
);

function updateScore(userId, gameType, points) {
  // Recherche d'abord s'il existe déjà un score pour cet utilisateur et ce jeu
  db.get(
    "SELECT points FROM scores WHERE userId = ? AND gameType = ?",
    [userId, gameType],
    (err, row) => {
      if (err) {
        console.error("Erreur lors de la recherche du score", err);
        return;
      }
      if (row) {
        // Mise à jour du score existant
        db.run(
          "UPDATE scores SET points = points + ? WHERE userId = ? AND gameType = ?",
          [points, userId, gameType],
          (err) => {
            if (err) {
              console.error("Erreur lors de la mise à jour du score", err);
            }
          }
        );
      } else {
        // Insertion d'un nouveau score
        db.run(
          "INSERT INTO scores (userId, gameType, points) VALUES (?, ?, ?)",
          [userId, gameType, points],
          (err) => {
            if (err) {
              console.error("Erreur lors de l'insertion du score", err);
            }
          }
        );
      }
    }
  );
}

async function showRanking(message, gameType) {
  // Liste des types de jeu valides
  const validGameTypes = [
    "skins",
    "skills",
    "guest",
    "opening",
    "item",
    "gold",
  ];

  if (!validGameTypes.includes(gameType)) {
    // Crée et envoi un embed informant l'utilisateur d'une erreur
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Type de jeu invalide")
      .setDescription(
        `Veuillez spécifier un type de jeu valide. Types disponibles : ${validGameTypes.join(
          ", "
        )}.`
      )
      .setFooter({ text: "Exemple : !classement skins" });

    await message.channel.send({ embeds: [errorEmbed] });
    return;
  }
  // Récupère les 10 meilleurs scores pour le type de jeu spécifié
  db.all(
    "SELECT userId, points FROM scores WHERE gameType = ? ORDER BY points DESC LIMIT 10",
    [gameType],
    (err, rows) => {
      if (err) {
        console.error("Erreur lors de la récupération des scores", err);
        return;
      }
      if (rows.length > 0) {
        let ranking = rows
          .map(
            (row, index) =>
              `${index + 1}. <@${row.userId}> avec ${row.points} points`
          )
          .join("\n");
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Classement pour ${gameType}`)
          .setDescription(ranking)
          .setFooter({ text: "Bravo à tous les participants !" });
        message.channel.send({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Classement pour ${gameType}`)
          .setDescription("Aucun score disponible pour le moment. ")
          .setFooter({
            text: "Participez pour apparaître dans le classement ! (jeux dispo : guest, skills, skins, opening, item)",
          });
        message.channel.send({ embeds: [embed] });
      }
    }
  );
}

module.exports = {
  updateScore,
  showRanking,
};
