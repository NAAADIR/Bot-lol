const sqlite3 = require('sqlite3').verbose();

// Crée ou ouvre la base de données
let db = new sqlite3.Database('./gameScores.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données', err);
  } else {
    console.log('Connecté à la base de données SQLite.');
    db.run("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, gameType TEXT, points INTEGER)", (err) => {
      if (err) {
        console.error("Erreur lors de la création de la table 'scores'", err);
      } else {
        console.log("Table 'scores' créée ou déjà existante.");
        db.close();
      }
    });
  }
});
