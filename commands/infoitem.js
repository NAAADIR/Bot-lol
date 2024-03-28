const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Fonction pour récupérer la liste de tous les objets
async function fetchAllItems() {
  const url =
    "http://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/item.json";
  try {
    const response = await axios.get(url);
    // Convertir l'objet des items en tableau pour faciliter la recherche
    return Object.values(response.data.data);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des objets:",
      error
    );
    return [];
  }
}

// Fonction pour rechercher un item par son nom
async function findItemByName(items, itemName) {
  const normalizedItemName = itemName.toLowerCase();
  return items.find((item) =>
    item.name.toLowerCase().includes(normalizedItemName)
  );
}

function cleanDescription(description) {
  // Remplace les balises
  let cleanDesc = description.replace(/<br>/g, "\n");
  cleanDesc = cleanDesc.replace(/<mainText>|<\/mainText>/g, "");
  cleanDesc = cleanDesc.replace(/<stats>|<\/stats>/g, "");
  cleanDesc = cleanDesc.replace(/<attention>(.*?)<\/attention>/g, "**$1**");
  cleanDesc = cleanDesc.replace(
    /<passive>(.*?)<\/passive>/g,
    "\n __Passif :__ $1"
  );

  // Supprimer les balises HTML restantes (s'il en reste) (Regex)
  cleanDesc = cleanDesc.replace(/<\/?[^>]+(>|$)/g, "");

  return cleanDesc;
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);
  const itemName = args.join(" ");

  if (!itemName) {
    return message.reply(
      "Veuillez spécifier le nom d'un objet après la commande !items."
    );
  }

  const items = await fetchAllItems();
  const item = await findItemByName(items, itemName);

  if (item) {
    // Utilise un nom différent pour la variable qui reçoit le résultat
    const descriptionClean = cleanDescription(item.description);

    const embed = new EmbedBuilder()
      .setTitle(item.name)
      .setColor(0x0099ff)
      .addFields(
        { name: "Description", value: descriptionClean, inline: false },
        {
          name: "Prix",
          value: `Total: ${item.gold.total} pièces d'or`,
          inline: true,
        }
      )
      .setThumbnail(
        `http://ddragon.leagueoflegends.com/cdn/14.6.1/img/item/${item.image.full}`
      );

    message.channel.send({ embeds: [embed] });
  } else {
    message.reply("Aucun objet trouvé avec ce nom.");
  }
};
