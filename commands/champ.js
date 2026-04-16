const { EmbedBuilder } = require("discord.js");
const {
  getChampionDetails,
  championSquareUrl,
  spellImageUrl,
  resolveChampionAssetId,
} = require("../services/lolDataService");

module.exports = async (message) => {
  const args = message.content.slice("!champ".length).trim().split(" ");
  const summonerInput = args.join(" ");

  try {
    const championId = await resolveChampionAssetId(summonerInput);
    if (!championId) {
      throw new Error("Champion introuvable");
    }

    const championData = await getChampionDetails(championId);
    const thumbnailUrl = await championSquareUrl(championData.name);

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
      .setTimestamp();

    if (thumbnailUrl) {
      embed.setThumbnail(thumbnailUrl);
    }

    await message.channel.send({ embeds: [embed] });

    // Embeds pour chaque compétence active
    championData.spells.forEach(async (spell) => {
      let skillEmbed = new EmbedBuilder()
        .setColor(0x0397ab)
        .setTitle(`${spell.name}`)
        .setDescription(`${spell.description}`)
        .setTimestamp();

      skillEmbed.setImage(await spellImageUrl(spell.image.full));

      await message.channel.send({ embeds: [skillEmbed] });
    });
  } catch (error) {
    console.error(error);
    message.channel.send(
      "Impossible de récupérer les informations du champion ou le champion n'existe pas."
    );
  }
};
