const sqlite3 = require("sqlite3").verbose();
const { EmbedBuilder } = require("discord.js");

const VALID_GAME_TYPES = [
  "skins",
  "skills",
  "guest",
  "opening",
  "item",
  "gold",
  "anime",
  "regionquiz",
];

const db = new sqlite3.Database(
  "./gameScores.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Erreur lors de la connexion à la base de données", err);
      return;
    }

    console.log("Connecté à la base de données SQLite pour les scores de jeu.");
  }
);

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, gameType TEXT, points INTEGER NOT NULL DEFAULT 0, UNIQUE(userId, gameType))"
  );
});

function updateScore(userId, gameType, points) {
  db.run(
    `INSERT INTO scores (userId, gameType, points)
     VALUES (?, ?, ?)
     ON CONFLICT(userId, gameType) DO UPDATE SET points = points + excluded.points`,
    [userId, gameType, points],
    (err) => {
      if (err) {
        console.error("Erreur lors de la mise à jour du score", err);
      }
    }
  );
}

async function showRanking(message, gameType) {
  if (!VALID_GAME_TYPES.includes(gameType)) {
    // Crée et envoi un embed informant l'utilisateur d'une erreur
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Type de jeu invalide")
      .setDescription(
        `Veuillez spécifier un type de jeu valide. Types disponibles : ${VALID_GAME_TYPES.join(
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
            text: "Participez pour apparaître dans le classement ! (jeux dispo : guest, skills, skins, opening, item, gold, anime, regionquiz)",
          });
        message.channel.send({ embeds: [embed] });
      }
    }
  );
}

async function showProfile(message, userId) {
  db.all(
    "SELECT gameType, points FROM scores WHERE userId = ? ORDER BY points DESC, gameType ASC",
    [userId],
    async (err, rows) => {
      if (err) {
        console.error("Erreur lors de la récupération du profil", err);
        await message.channel.send("Impossible de récupérer le profil joueur.");
        return;
      }

      const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);
      const bestGames = rows.length
        ? rows
            .slice(0, 5)
            .map((row) => `- ${row.gameType} : ${row.points} pts`)
            .join("\n")
        : "Aucun score enregistré pour le moment.";

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Profil mini-jeux")
        .setDescription(`<@${userId}>`)
        .addFields(
          {
            name: "Total de points",
            value: String(totalPoints),
            inline: true,
          },
          {
            name: "Jeux joués",
            value: String(rows.length),
            inline: true,
          },
          {
            name: "Meilleurs scores",
            value: bestGames,
            inline: false,
          }
        );

      await message.channel.send({ embeds: [embed] });
    }
  );
}

module.exports = {
  updateScore,
  showRanking,
  showProfile,
  VALID_GAME_TYPES,
};
