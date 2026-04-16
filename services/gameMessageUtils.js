const { EmbedBuilder } = require("discord.js");

function createGameEmbed(title, description, color = 0x0099ff) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description);
}

function createInfoEmbed(title, description) {
  return createGameEmbed(title, description, 0x0099ff);
}

function createSuccessEmbed(title, description) {
  return createGameEmbed(title, description, 0x57f287);
}

function createErrorEmbed(title, description) {
  return createGameEmbed(title, description, 0xed4245);
}

function getCommandArgs(message, commandName) {
  return message.content.slice(commandName.length).trim();
}

module.exports = {
  createInfoEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  getCommandArgs,
};
