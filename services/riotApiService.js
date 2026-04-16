const axios = require("axios");
const { RIOT_API_KEY } = require("../config/config");

const platformClient = axios.create({
  baseURL: "https://euw1.api.riotgames.com",
  timeout: 10000,
});

const regionalClient = axios.create({
  baseURL: "https://europe.api.riotgames.com",
  timeout: 10000,
});

function authParams() {
  return { params: { api_key: RIOT_API_KEY } };
}

function parseRiotId(input) {
  const raw = String(input || "").trim();
  const [gameName, tagLine] = raw.split("#");
  if (gameName && tagLine) {
    return { gameName, tagLine };
  }
  return null;
}

async function getSummonerIdentity(input) {
  const riotId = parseRiotId(input);

  if (riotId) {
    const accountResponse = await regionalClient.get(
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        riotId.gameName
      )}/${encodeURIComponent(riotId.tagLine)}`,
      authParams()
    );

    const summonerResponse = await platformClient.get(
      `/lol/summoner/v4/summoners/by-puuid/${accountResponse.data.puuid}`,
      authParams()
    );

    return {
      puuid: accountResponse.data.puuid,
      summonerId: summonerResponse.data.id,
      displayName: `${accountResponse.data.gameName}#${accountResponse.data.tagLine}`,
    };
  }

  const summonerResponse = await platformClient.get(
    `/lol/summoner/v4/summoners/by-name/${encodeURIComponent(input)}`,
    authParams()
  );

  return {
    puuid: summonerResponse.data.puuid,
    summonerId: summonerResponse.data.id,
    displayName: summonerResponse.data.name,
  };
}

module.exports = {
  getSummonerIdentity,
};
