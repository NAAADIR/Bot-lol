const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const NEWS_URL = "https://lolesports.com/en-US/news";
const CHANNEL_ID = "838462200741101568";
const MENTION_USER_ID = "770022306541600778";
const POLL_INTERVAL_MS = 1000 * 60 * 10; // 10 minutes
const STORAGE_PATH = path.join(__dirname, "..", "data");
const LAST_FILE = path.join(STORAGE_PATH, "news_last.json");

function ensureStorage() {
  if (!fs.existsSync(STORAGE_PATH))
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  if (!fs.existsSync(LAST_FILE))
    fs.writeFileSync(LAST_FILE, JSON.stringify({ lastUrl: null }, null, 2));
}

async function fetchLatestArticle() {
  const res = await axios.get(NEWS_URL, { timeout: 10000 });
  const html = res.data;

  // Simple extraction: cherche la première ancre qui contient /en-US/news/ et un titre
  const articleRegex =
    /<a[^>]+href=\"(\/en-US\/news\/[^"]+)\"[^>]*>([\s\S]*?)<\/a>/i;
  const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/i;

  const match = articleRegex.exec(html);
  if (!match) return null;

  const relative = match[1];
  const articleUrl = new URL(relative, "https://lolesports.com").toString();

  // try to extract title from the matched anchor or nearby
  let title = null;
  const anchorHtml = match[2];
  const tmatch = titleRegex.exec(anchorHtml);
  if (tmatch) title = tmatch[1].trim();

  // fallback: search for og:title meta
  if (!title) {
    const og = /<meta property=\"og:title\" content=\"([^\"]+)\"\/>/i.exec(
      html
    );
    if (og) title = og[1];
  }

  return { url: articleUrl, title: title || "Nouvelle news LoLEsports" };
}

async function sendNotification(client, article) {
  const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(article.title)
    .setURL(article.url)
    .setColor(0xff4655)
    .setDescription(`Une nouvelle news est publiée sur LoLEsports.`)
    .addFields({ name: "Lien", value: `[Voir l'article](${article.url})` })
    .setTimestamp()
    .setFooter({
      text: "LoLEsports - Surveillance",
      iconURL: client.user.displayAvatarURL(),
    });

  await channel.send({ content: `<@${MENTION_USER_ID}>`, embeds: [embed] });
}

async function checkOnce(client) {
  try {
    ensureStorage();
    const latest = await fetchLatestArticle();
    if (!latest) return;

    const raw = fs.readFileSync(LAST_FILE, "utf8");
    const data = JSON.parse(raw || "{}");
    const lastUrl = data.lastUrl || null;

    if (latest.url !== lastUrl) {
      // save and notify
      fs.writeFileSync(
        LAST_FILE,
        JSON.stringify({ lastUrl: latest.url }, null, 2)
      );
      await sendNotification(client, latest);
    }
  } catch (err) {
    console.error("newsWatcher error:", err.message || err);
  }
}

module.exports = function startNewsWatcher(client) {
  ensureStorage();
  // check immediately then on interval
  checkOnce(client);
  setInterval(() => checkOnce(client), POLL_INTERVAL_MS);
};
