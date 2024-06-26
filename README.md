# Bot-LOL

## Description

**Bot-LOL** est un bot Discord polyvalent conçu pour améliorer l'expérience des utilisateurs sur les serveurs Discord. Avec une variété de commandes interactives et de fonctionnalités automatisées, **Bot-LOL** sert à la fois de divertissement et d'outil de gestion de serveur.

## Fonctionnalités

- **Jeux et Divertissements** : Inclut des jeux interactifs comme deviner des champions, des skins, et plus.
- **Informations sur League of Legends** : Offre des commandes pour afficher des statistiques de joueurs, l'historique des matchs, le classement Elo, et la rotation actuelle des champions.
- **Intégrations** : Intègre des fonctionnalités liées à d'autres services et API pour fournir des informations utiles, comme les actualités sur les animes ou des détails sur des items dans LoL.

## Prérequis

- Node.js version 12.x ou supérieure.
- Un compte Discord et un bot Discord créé via le [Portail des Développeurs Discord](https://discord.com/developers/applications).
- Les tokens et les clés API nécessaires pour les intégrations tierces.

## Installation

### Clonez le dépôt

```sh
git clone https://github.com/votreusername/votrerepo.git
```

### Installez les dépendances NPM

```sh
cd votrerepo
npm install
```

### Configurez vos variables d'environnement :

Créez un fichier .env à la racine de votre projet et ajoutez-y vos tokens et clés API :

```sh
DISCORD_BOT_TOKEN=votre_token_discord
RIOT_API_KEY=votre_clé_riot
```

### Lancez le bot :

```sh
node bot.js
```

## Utilisation

Après avoir lancé le bot, vous pouvez commencer à utiliser ses commandes sur votre serveur Discord. Voici quelques commandes disponibles :

- **!help** : Affiche la liste des commandes disponibles.
- **!lolhistory <ID>** : Donne l'historique des matchs LoL d'un joueur.
- **!elo <ID>** : Affiche le classement Elo d'un joueur.
- **!rotation** : Montre la rotation actuelle des champions gratuits.

Assurez-vous d'inviter le bot sur votre serveur Discord en utilisant le lien généré dans le Portail des Développeurs Discord.

Vous pouvez trouvez des fichiers champions.json/opening.json que vous pouvez modifiez à votre sauce, le premier fichier permet de jouer au jeu !guest et le deuxième au jeu !opening

## Contribution

Les contributions sont les bienvenues ! Si vous souhaitez contribuer, veuillez forker le dépôt, créer une branche pour vos modifications, puis soumettre une pull request.
