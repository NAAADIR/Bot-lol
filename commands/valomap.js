const axios = require("axios");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const https = require("https");

module.exports = async function valomap(message) {
  try {
    const res = await axios.get(
      "https://valorant-api.com/v1/maps?language=fr-FR"
    );
    const maps = res.data.data;

    const filteredMaps = maps.filter((map) => map.splash);

    if (filteredMaps.length === 0) {
      return message.reply("Aucune carte avec image trouvée.");
    }

    const randomMap =
      filteredMaps[Math.floor(Math.random() * filteredMaps.length)];
    const mapName = randomMap.displayName.toLowerCase();
    const mapImageUrl = randomMap.splash;

    // Embed
    const embed = new EmbedBuilder()
      .setColor(0x00ffcc)
      .setTitle("Devine cette carte de Valorant !")
      .setImage(mapImageUrl)
      .setFooter({ text: "Tu as 30 secondes pour répondre." });

    await message.channel.send({ embeds: [embed] });

    const filter = (m) => !m.author.bot && m.channel.id === message.channel.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 30_000,
    });

    collector.on("collect", (m) => {
      if (m.content.toLowerCase().includes(mapName)) {
        collector.stop("guessed");
        m.reply(`🎉 Bien joué ! C'était bien **${randomMap.displayName}** !`);
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason !== "guessed") {
        message.channel.send(
          `⏱️ Temps écoulé ! La carte était : **${randomMap.displayName}**.`
        );
      }
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des cartes :", err);
    message.reply(
      "❌ Une erreur est survenue lors de la récupération de la carte."
    );
  }
};
