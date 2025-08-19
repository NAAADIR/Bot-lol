const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const cheerio = require("cheerio");

const NEWS_URL = "https://lolesports.com/en-US/news";
const CHANNEL_ID = "838462200741101568";
const MENTION_USER_ID = "770022306541600778";
const POLL_INTERVAL_MS = 1000 * 60 * 10; // 10 minutes
// Keywords to filter notifications (lowercase)
const KEYWORDS = [
  "worlds",
  "ticket",
  "tickets",
  "sale",
  "on sale",
  "ticketing",
];
const STORAGE_PATH = path.join(__dirname, "..", "data");
const LAST_FILE = path.join(STORAGE_PATH, "news_last.json");

function ensureStorage() {
  if (!fs.existsSync(STORAGE_PATH))
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  if (!fs.existsSync(LAST_FILE)) {
    fs.writeFileSync(LAST_FILE, JSON.stringify({ lastUrl: null }, null, 2));
    console.log(
      "[newsWatcher] Created last-file with null lastUrl:",
      LAST_FILE
    );
  }
}

async function fetchLatestArticle() {
  console.log("[newsWatcher] Fetching news page:", NEWS_URL);
  const res = await axios.get(NEWS_URL, { timeout: 10000 });
  const html = res.data;

  // Use cheerio for robust parsing
  const $ = cheerio.load(html);

  // Try to find the first anchor that links to a news article
  let anchor = $('a[href*="/en-US/news/"]').first();

  // If nothing found, try a broader selector for article links
  if (!anchor || anchor.length === 0) {
    anchor = $("a")
      .filter((i, el) => {
        const href = $(el).attr("href") || "";
        return href.includes("/en-US/news/");
      })
      .first();
  }

  if (!anchor || anchor.length === 0) {
    console.log("[newsWatcher] No article anchor found with cheerio");
    return null;
  }

  const href = (anchor.attr("href") || "").trim();
  if (!href) {
    console.log("[newsWatcher] Anchor found but no href attribute");
    return null;
  }

  const articleUrl = href.startsWith("http")
    ? href
    : new URL(href, "https://lolesports.com").toString();

  // Try different ways to get a title
  let title = (anchor.find("h3").text() || anchor.text() || "").trim();
  if (!title) title = $('meta[property="og:title"]').attr("content") || "";

  console.log(
    "[newsWatcher] Found article (cheerio):",
    articleUrl,
    "| title:",
    title
  );
  return { url: articleUrl, title: title || "Nouvelle news LoLEsports" };
}

async function sendNotification(client, article) {
  console.log("[newsWatcher] Sending notification for:", article.url);
  const channel = await client.channels.fetch(CHANNEL_ID).catch((e) => {
    console.error(
      "[newsWatcher] Failed to fetch channel:",
      CHANNEL_ID,
      e && e.message ? e.message : e
    );
    return null;
  });
  if (!channel) {
    console.log("[newsWatcher] Channel not available, aborting send.");
    return;
  }

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
    console.log("[newsWatcher] checkOnce start");
    ensureStorage();
    const latest = await fetchLatestArticle();
    if (!latest) {
      console.log("[newsWatcher] No latest article found, skipping.");
      return;
    }

    const raw = fs.readFileSync(LAST_FILE, "utf8");
    const data = JSON.parse(raw || "{}");
    const lastUrl = data.lastUrl || null;

    console.log("[newsWatcher] lastUrl from file:", lastUrl);
    console.log("[newsWatcher] latest.url found:", latest.url);

    if (latest.url !== lastUrl) {
      // save new lastUrl immediately to avoid duplicate handling on next run
      fs.writeFileSync(
        LAST_FILE,
        JSON.stringify({ lastUrl: latest.url }, null, 2)
      );
      console.log("[newsWatcher] Updated lastUrl in file to:", latest.url);

      // If this is the first run (no previous lastUrl), skip notification but persist the URL
      if (!lastUrl) {
        console.log(
          "[newsWatcher] First run detected (lastUrl was null) — skipping notification."
        );
        return;
      }

      // Apply keyword filter: notify only if title or url contains any keyword
      const normalizedTitle = (latest.title || "").toLowerCase();
      const normalizedUrl = (latest.url || "").toLowerCase();
      const matchesKeyword = KEYWORDS.some(
        (k) => normalizedTitle.includes(k) || normalizedUrl.includes(k)
      );

      if (matchesKeyword) {
        console.log(
          "[newsWatcher] Article matches keywords — sending notification."
        );
        await sendNotification(client, latest);
      } else {
        console.log(
          "[newsWatcher] Article is new but does not match keywords — not notifying."
        );
      }
    } else {
      console.log("[newsWatcher] No new article (urls identical).");
    }
  } catch (err) {
    console.error("newsWatcher error:", err && err.stack ? err.stack : err);
  }
}

module.exports = function startNewsWatcher(client) {
  ensureStorage();
  // check immediately then on interval
  checkOnce(client);
  setInterval(() => checkOnce(client), POLL_INTERVAL_MS);
};
