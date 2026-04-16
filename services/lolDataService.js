const axios = require("axios");

const DEFAULT_LOCALE = "fr_FR";
const VERSION_CACHE_MS = 1000 * 60 * 60 * 12;
const DATA_CACHE_MS = 1000 * 60 * 10;

const client = axios.create({
  timeout: 10000,
});

let versionCache = {
  value: "14.6.1",
  expiresAt: 0,
};

const dataCache = new Map();

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function getLatestVersion() {
  if (versionCache.expiresAt > Date.now()) {
    return versionCache.value;
  }

  try {
    const response = await client.get(
      "https://ddragon.leagueoflegends.com/api/versions.json"
    );
    const version = response.data && response.data[0] ? response.data[0] : "14.6.1";
    versionCache = {
      value: version,
      expiresAt: Date.now() + VERSION_CACHE_MS,
    };
    return version;
  } catch (error) {
    console.error("[lolDataService] Impossible de récupérer la version:", error);
    versionCache.expiresAt = Date.now() + 1000 * 60 * 5;
    return versionCache.value;
  }
}

async function getCached(key, loader) {
  const cached = dataCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await loader();
  dataCache.set(key, {
    value,
    expiresAt: Date.now() + DATA_CACHE_MS,
  });
  return value;
}

async function getChampionList(locale = DEFAULT_LOCALE) {
  const version = await getLatestVersion();
  const cacheKey = `champion-list:${version}:${locale}`;

  return getCached(cacheKey, async () => {
    const response = await client.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/champion.json`
    );
    return response.data.data;
  });
}

async function getChampionDetails(championId, locale = DEFAULT_LOCALE) {
  const version = await getLatestVersion();
  const cacheKey = `champion-details:${version}:${locale}:${championId}`;

  return getCached(cacheKey, async () => {
    const response = await client.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/champion/${championId}.json`
    );
    return response.data.data[championId];
  });
}

async function getItems(locale = DEFAULT_LOCALE) {
  const version = await getLatestVersion();
  const cacheKey = `items:${version}:${locale}`;

  return getCached(cacheKey, async () => {
    const response = await client.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/item.json`
    );
    return response.data.data;
  });
}

async function getRunes(locale = DEFAULT_LOCALE) {
  const version = await getLatestVersion();
  const cacheKey = `runes:${version}:${locale}`;

  return getCached(cacheKey, async () => {
    const response = await client.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/runesReforged.json`
    );
    return response.data;
  });
}

async function resolveChampionAssetId(name, locale = DEFAULT_LOCALE) {
  const champions = await getChampionList(locale);
  const normalizedTarget = normalizeName(name);

  const exactChampion = Object.values(champions).find(
    (champion) =>
      normalizeName(champion.name) === normalizedTarget ||
      normalizeName(champion.id) === normalizedTarget
  );

  return exactChampion ? exactChampion.id : null;
}

async function getDailySeed() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function seededIndex(length, seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash) % length;
}

async function getDailyChampion(locale = DEFAULT_LOCALE) {
  const champions = Object.values(await getChampionList(locale));
  const seed = await getDailySeed();
  return champions[seededIndex(champions.length, seed)];
}

async function championSquareUrl(championName, locale = DEFAULT_LOCALE) {
  const version = await getLatestVersion();
  const assetId = await resolveChampionAssetId(championName, locale);
  return assetId
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${assetId}.png`
    : null;
}

async function spellImageUrl(fileName) {
  const version = await getLatestVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${fileName}`;
}

async function itemImageUrl(fileName) {
  const version = await getLatestVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${fileName}`;
}

async function splashUrl(championId, skinNum) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
}

module.exports = {
  DEFAULT_LOCALE,
  normalizeName,
  getLatestVersion,
  getChampionList,
  getChampionDetails,
  getItems,
  getRunes,
  resolveChampionAssetId,
  getDailyChampion,
  championSquareUrl,
  spellImageUrl,
  itemImageUrl,
  splashUrl,
};
