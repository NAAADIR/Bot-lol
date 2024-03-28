const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

async function fetchAllRunes() {
  const url =
    "https://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/runesReforged.json";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des runes:",
      error
    );
    return [];
  }
}

function cleanDescription(description) {
  return description
    .replace(/<br>/g, "\n")
    .replace(/<.*?>/g, "") 
    .replace(/\n{2,}/g, "\n\n") 
    .trim();
}

async function findRuneByName(runes, runeName) {
  let foundRune = null;
  runes.forEach((category) => {
    category.slots.forEach((slot) => {
      slot.runes.forEach((rune) => {
        if (rune.name.toLowerCase().includes(runeName.toLowerCase())) {
          foundRune = rune;
        }
      });
    });
  });
  return foundRune;
}

module.exports = async (message) => {
  const args = message.content.split(" ").slice(1);
  const runeName = args.join(" ");

  if (!runeName) {
    return message.reply(
      "Veuillez spécifier le nom d'une rune après la commande !inforune."
    );
  }

  const runes = await fetchAllRunes();
  const rune = await findRuneByName(runes, runeName);

  if (rune) {
    const embed = new EmbedBuilder()
      .setTitle(rune.name)
      .setColor(0x0099ff)
      .setDescription(cleanDescription(rune.longDesc))
      .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`); 

    message.channel.send({ embeds: [embed] });
  } else {
    message.reply("Aucune rune trouvée avec ce nom.");
  }
};
