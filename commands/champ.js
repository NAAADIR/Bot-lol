// Description: Command to get information about a champion in League of Legends
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

module.exports = async (message) => {
  const args = message.content.slice("!champ".length).trim().split(" ");
  const summonerInput = args.join(" ");

  try {
    const championResponse = await axios.get(
      `http://ddragon.leagueoflegends.com/cdn/14.6.1/data/fr_FR/champion/${encodeURIComponent(
        summonerInput
      )}.json`
    );

    const championData = Object.values(championResponse.data.data)[0];
    const baseUrl = "http://ddragon.leagueoflegends.com/cdn/14.6.1/img/";

    // Embed pour la description générale et la compétence passive
    let embed = new EmbedBuilder()
      .setColor(0x0397ab)
      .setTitle(`${championData.name} - ${championData.title}`)
      .addFields(
        { name: "Rôle", value: championData.tags.join(", "), inline: true },
        {
          name: "Compétence passive",
          value: `${championData.passive.name}: ${championData.passive.description}`,
        }
      )
      .setThumbnail(`${baseUrl}champion/${championData.id}.png`)
      .setImage(`${baseUrl}passive/${championData.passive.image.full}`)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    // Embeds pour chaque compétence active
    championData.spells.forEach(async (spell) => {
      let skillEmbed = new EmbedBuilder()
        .setColor(0x0397ab)
        .setTitle(`${spell.name}`)
        .setDescription(`${spell.description}`)
        .setImage(`${baseUrl}spell/${spell.image.full}`)
        .setTimestamp();

      await message.channel.send({ embeds: [skillEmbed] });
    });
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer les informations du champion ou le champion n'existe pas."
    );
  }
};
