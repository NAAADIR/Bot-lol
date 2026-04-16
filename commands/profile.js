const { showProfile } = require("./classement");

module.exports = async (message) => {
  const mention = message.mentions.users.first();
  const userId = mention ? mention.id : message.author.id;
  await showProfile(message, userId);
};
