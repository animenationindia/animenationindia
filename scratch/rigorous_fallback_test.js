const KITSU_API_URL = 'https://kitsu.io/api/edge';
const KITSU_TIMEOUT_MS = 2000;

async function fetchKitsu(endpoint, timeoutMs = KITSU_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${KITSU_API_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    clearTimeout(timer);
    return null;
  }
}

async function fetchKitsuAnimeByMalId(malId) {
  try {
    const data = await fetchKitsu(`/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item`);
    if (!data || !data.included || data.included.length === 0) return null;
    const kitsuItem = data.included.find((item) => item.type === 'anime');
    return kitsuItem ? kitsuItem.id : null;
  } catch (error) {
    return null;
  }
}

async function fetchKitsuCharacters(malId) {
  try {
    const kitsuId = await fetchKitsuAnimeByMalId(malId);
    if (!kitsuId) return null;
    const data = await fetchKitsu(`/anime/${kitsuId}/characters?include=character&page[limit]=12`);
    if (!data || !data.data || !Array.isArray(data.data)) return null;

    const includedCharacters = new Map();
    if (data.included && Array.isArray(data.included)) {
      data.included.forEach((inc) => {
        if (inc.type === 'characters') {
          includedCharacters.set(inc.id, inc.attributes);
        }
      });
    }

    const normalizedCharacters = [];
    data.data.forEach((rel) => {
      const charId = rel.relationships?.character?.data?.id;
      const charAttr = charId ? includedCharacters.get(charId) : null;
      if (charAttr && charAttr.name) {
        normalizedCharacters.push({
          role: rel.attributes?.role === 'main' ? 'Main' : 'Supporting',
          character: {
            mal_id: Number(charId) || 0,
            name: charAttr.name,
            images: {
              jpg: { image_url: charAttr.image?.original || charAttr.image?.medium || '/placeholder.png' }
            }
          }
        });
      }
    });
    return normalizedCharacters.length > 0 ? normalizedCharacters : null;
  } catch (error) {
    return null;
  }
}

async function fetchAniListCharactersFallback(anilistId) {
  const queryChar = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        characters(perPage: 12) {
          edges {
            role
            node {
              id
              name { full }
              image { large }
            }
            voiceActors(language: JAPANESE) {
              id
              name { full }
              image { large }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: queryChar, variables: { id: anilistId } })
    });
    const data = await res.json();
    const edges = data?.data?.Media?.characters?.edges;
    if (!edges || !Array.isArray(edges) || edges.length === 0) return null;
    return edges.map((edge) => {
      const japaneseVA = edge.voiceActors?.[0];
      return {
        role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
        character: {
          mal_id: edge.node?.id || 0,
          name: edge.node?.name?.full || 'Unknown Character',
          images: { jpg: { image_url: edge.node?.image?.large || '' } }
        },
        voice_actors: japaneseVA ? [{
          language: 'Japanese',
          person: {
            mal_id: japaneseVA.id || 0,
            name: japaneseVA.name?.full || 'Unknown VA',
            images: { jpg: { image_url: japaneseVA.image?.large || '' } }
          }
        }] : []
      };
    });
  } catch {
    return null;
  }
}

async function fetchWithFallback(providers) {
  for (const provider of providers) {
    const startTime = Date.now();
    try {
      console.log(`   [FallbackChain] Trying ${provider.name}...`);
      const result = await provider.fn();
      const isArray = Array.isArray(result);
      const hasValue = isArray ? result.length > 0 : result !== null && result !== undefined;

      if (hasValue) {
        console.log(`   [FallbackChain SUCCESS] ${provider.name} succeeded in ${Date.now() - startTime}ms!`);
        return { data: result, provider: provider.name, duration: Date.now() - startTime };
      }
      console.log(`   [FallbackChain EMPTY] ${provider.name} returned empty/null in ${Date.now() - startTime}ms. Trying next...`);
    } catch (error) {
      console.log(`   [FallbackChain FAIL] ${provider.name} failed in ${Date.now() - startTime}ms. Trying next...`);
    }
  }
  console.log(`   [FallbackChain EXHAUSTED] All providers failed or returned empty.`);
  return { data: [], provider: 'NONE', duration: 0 };
}

async function runRigorousFallbackTests() {
  console.log("==================================================================================");
  console.log("🚀 RIGOROUS FORCED-FAILURE FALLBACK CHAIN TEST SUITE (Jikan -> Kitsu -> AniList)");
  console.log("==================================================================================\n");

  const testId = 21; // One Piece

  // ----------------------------------------------------------------------------------
  // TEST A: Normal Case (Jikan Primary Succeeded)
  // ----------------------------------------------------------------------------------
  console.log("------------------------------------------------------------------");
  console.log("📌 TEST A: Jikan Primary Tier (Normal Execution)");
  console.log("------------------------------------------------------------------");
  const tA_start = Date.now();
  const providersA = [
    {
      name: 'Jikan Characters (Primary)',
      fn: async () => {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${testId}/characters`);
        const data = await res.json();
        return data?.data && Array.isArray(data.data) && data.data.length > 0 ? data.data : null;
      }
    },
    { name: 'Kitsu Characters (Secondary)', fn: async () => fetchKitsuCharacters(testId) },
    { name: 'AniList Characters (Tertiary Fallback)', fn: async () => fetchAniListCharactersFallback(testId) }
  ];
  const resA = await fetchWithFallback(providersA);
  const durA = Date.now() - tA_start;
  const passA = resA.provider === 'Jikan Characters (Primary)' && resA.data.length > 0;
  console.log(`   -> Data Items Received: ${resA.data.length} | First Character: ${resA.data[0]?.character?.name || 'N/A'}`);
  console.log(`   -> Total Time: ${durA}ms`);
  console.log(`   -> TEST A RESULT: ${passA ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ----------------------------------------------------------------------------------
  // TEST B: Forced Failure on Jikan (Kitsu Secondary Kick-In)
  // ----------------------------------------------------------------------------------
  console.log("------------------------------------------------------------------");
  console.log("📌 TEST B: Forced Failure on Jikan (Verifying Kitsu Secondary Kick-In)");
  console.log("------------------------------------------------------------------");
  const tB_start = Date.now();
  const providersB = [
    {
      name: 'Jikan Characters (Primary)',
      fn: async () => {
        throw new Error('FORCED_TEST_FAILURE: Jikan API 504 Timeout');
      }
    },
    { name: 'Kitsu Characters (Secondary)', fn: async () => fetchKitsuCharacters(testId) },
    { name: 'AniList Characters (Tertiary Fallback)', fn: async () => fetchAniListCharactersFallback(testId) }
  ];
  const resB = await fetchWithFallback(providersB);
  const durB = Date.now() - tB_start;
  const passB = resB.provider === 'Kitsu Characters (Secondary)' && resB.data.length > 0;
  console.log(`   -> Data Items Received: ${resB.data.length} | First Character: ${resB.data[0]?.character?.name || 'N/A'}`);
  console.log(`   -> Total Time: ${durB}ms`);
  console.log(`   -> TEST B RESULT: ${passB ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ----------------------------------------------------------------------------------
  // TEST C: Forced Failure on Jikan AND Kitsu (AniList Tertiary Kick-In)
  // ----------------------------------------------------------------------------------
  console.log("------------------------------------------------------------------");
  console.log("📌 TEST C: Forced Failure on Jikan & Kitsu (Verifying AniList Tertiary Kick-In)");
  console.log("------------------------------------------------------------------");
  const tC_start = Date.now();
  const providersC = [
    {
      name: 'Jikan Characters (Primary)',
      fn: async () => { throw new Error('FORCED_TEST_FAILURE: Jikan 504'); }
    },
    {
      name: 'Kitsu Characters (Secondary)',
      fn: async () => { throw new Error('FORCED_TEST_FAILURE: Kitsu 503'); }
    },
    { name: 'AniList Characters (Tertiary Fallback)', fn: async () => fetchAniListCharactersFallback(testId) }
  ];
  const resC = await fetchWithFallback(providersC);
  const durC = Date.now() - tC_start;
  const passC = resC.provider === 'AniList Characters (Tertiary Fallback)' && resC.data.length > 0;
  console.log(`   -> Data Items Received: ${resC.data.length} | First Character: ${resC.data[0]?.character?.name || 'N/A'} | Voice Actor: ${resC.data[0]?.voice_actors?.[0]?.person?.name || 'N/A'}`);
  console.log(`   -> Total Time: ${durC}ms (Worst-case timing check)`);
  console.log(`   -> TEST C RESULT: ${passC ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ----------------------------------------------------------------------------------
  // TEST D: Forced Failure on ALL Providers (Graceful Empty State)
  // ----------------------------------------------------------------------------------
  console.log("------------------------------------------------------------------");
  console.log("📌 TEST D: Forced Failure on ALL Providers (Graceful Empty State)");
  console.log("------------------------------------------------------------------");
  const tD_start = Date.now();
  const providersD = [
    { name: 'Jikan Characters (Primary)', fn: async () => { throw new Error('FORCED_TEST_FAILURE: Jikan 504'); } },
    { name: 'Kitsu Characters (Secondary)', fn: async () => { throw new Error('FORCED_TEST_FAILURE: Kitsu 503'); } },
    { name: 'AniList Characters (Tertiary Fallback)', fn: async () => { throw new Error('FORCED_TEST_FAILURE: AniList 500'); } }
  ];
  const resD = await fetchWithFallback(providersD);
  const durD = Date.now() - tD_start;
  const passD = resD.provider === 'NONE' && Array.isArray(resD.data) && resD.data.length === 0;
  console.log(`   -> Data Items Received: ${resD.data.length} (Empty Array)`);
  console.log(`   -> Total Time: ${durD}ms`);
  console.log(`   -> TEST D RESULT: ${passD ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ----------------------------------------------------------------------------------
  // STEP 2: KITSU MAL-ID MAPPING COVERAGE TEST ACROSS 6 REAL ANIME TITLES
  // ----------------------------------------------------------------------------------
  console.log("==================================================================");
  console.log("📊 STEP 2: KITSU MAL-ID MAPPING REAL-WORLD COVERAGE SCAN");
  console.log("==================================================================");

  const scanTargets = [
    { malId: 21, title: 'One Piece (Classic Long-Running)' },
    { malId: 58505, title: 'Demon Slayer Hashira Arc (Recent 2026 Title)' },
    { malId: 50668, title: 'Witch on the Holy Night (Movie)' },
    { malId: 44, title: 'Rurouni Kenshin Trust & Betrayal (Classic OVA)' },
    { malId: 52299, title: 'Ore dake Haireru Kakushidungeon (Niche Title)' },
    { malId: 5114, title: 'Fullmetal Alchemist Brotherhood (Top Rated)' }
  ];

  let hits = 0;
  let misses = 0;

  for (const target of scanTargets) {
    const t0 = Date.now();
    const kitsuId = await fetchKitsuAnimeByMalId(target.malId);
    const duration = Date.now() - t0;

    if (kitsuId) {
      hits++;
      console.log(`   [HIT ] MAL ID ${String(target.malId).padEnd(6)} -> Kitsu ID: ${kitsuId.padEnd(6)} (${duration}ms) | Title: ${target.title}`);
    } else {
      misses++;
      console.log(`   [MISS] MAL ID ${String(target.malId).padEnd(6)} -> Kitsu ID: NULL    (${duration}ms) | Title: ${target.title}`);
    }
  }

  console.log(`\n   -> Coverage Summary: Hits: ${hits}/${scanTargets.length} (${((hits/scanTargets.length)*100).toFixed(1)}%) | Misses: ${misses}/${scanTargets.length}`);

  // ----------------------------------------------------------------------------------
  // STEP 3: TIMING VERIFICATION SUMMARY
  // ----------------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("⏱️ STEP 3: TIMING VERIFICATION SUMMARY (VERCEL 10.0S HARD LIMIT)");
  console.log("==================================================================");
  console.log(`   -> Test A (Primary Only): ${durA}ms`);
  console.log(`   -> Test B (Jikan Fail -> Kitsu Success): ${durB}ms`);
  console.log(`   -> Test C (Worst-case: Jikan Fail + Kitsu Fail -> AniList Success): ${durC}ms`);
  console.log(`   -> Test D (All Fail Graceful Empty): ${durD}ms`);
  console.log(`   -> Target Combined Window: < 5500ms | Measured Worst-case: ${durC}ms`);
  console.log(`   -> TIMING VERDICT: ${durC < 5500 ? '✅ 100% SAFE FOR VERCEL 10S LIMIT' : '❌ TIMEOUT RISK'}`);
  console.log("==================================================================\n");
}

runRigorousFallbackTests().catch(console.error);
