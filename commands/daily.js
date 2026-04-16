const championStats = require("../champion.json");
const { createInfoEmbed } = require("../services/gameMessageUtils");
const { getDailyChampion } = require("../services/lolDataService");

module.exports = async (message) => {
  try {
    const dailyChampion = await getDailyChampion();
    const localData = championStats.find(
      (champion) => champion.name.toLowerCase() === dailyChampion.name.toLowerCase()
    );

    const embed = createInfoEmbed(
      "Daily LoL",
      `Champion du jour : **${dailyChampion.name}**`
    )
      .addFields(
        {
          name: "Titre",
          value: dailyChampion.title || "Inconnu",
          inline: false,
        },
        {
          name: "Role conseille",
          value: localData ? localData.role : "Inconnu",
          inline: true,
        },
        {
          name: "Region",
          value: localData ? localData.region : "Inconnue",
          inline: true,
        },
        {
          name: "Defi du jour",
          value: `Essaie une partie ou un quiz autour de **${dailyChampion.name}** et compare tes scores avec \`!profile\`.`,
          inline: false,
        }
      );

    if (dailyChampion.blurb) {
      embed.addFields({
        name: "Fun fact",
        value: dailyChampion.blurb.slice(0, 250),
        inline: false,
      });
    }

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur daily:", error);
    await message.channel.send(
      "Impossible de recuperer le Daily LoL pour le moment."
    );
  }
};
