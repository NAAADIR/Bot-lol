const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

module.exports = async function valoskins(message) {
  try {
    const res = await axios.get(
      "https://valorant-api.com/v1/weapons/skins?language=fr-FR"
    );
    const skins = res.data.data;

    // Filtrer uniquement les skins avec une image
    const validSkins = skins.filter(
      (skin) =>
        skin.levels?.[0]?.displayIcon && !skin.displayName.includes("Standard")
    );

    if (validSkins.length === 0) {
      return message.reply("Aucun skin disponible à afficher.");
    }

    const randomSkin =
      validSkins[Math.floor(Math.random() * validSkins.length)];
    const skinName = randomSkin.displayName.toLowerCase();
    const skinImage = randomSkin.levels[0].displayIcon;

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle("Devine le nom de ce skin !")
      .setImage(skinImage)
      .setFooter({ text: "Tu as 30 secondes pour répondre." });

    const sentMessage = await message.channel.send({ embeds: [embed] });

    const filter = (m) => !m.author.bot && m.channel.id === message.channel.id;

    const collector = message.channel.createMessageCollector({
      filter,
      time: 30_000, // 30 secondes
    });

    collector.on("collect", (m) => {
      if (m.content.toLowerCase().includes(skinName)) {
        collector.stop("guessed");
        m.reply(`🎉 Bravo ! C'était bien **${randomSkin.displayName}** !`);
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason !== "guessed") {
        message.channel.send(
          `⏱️ Temps écoulé ! Le skin était : **${randomSkin.displayName}**.`
        );
      }
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des skins :", err);
    message.reply(
      "❌ Une erreur est survenue lors de la récupération du skin."
    );
  }
};
