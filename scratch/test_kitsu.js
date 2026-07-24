async function testKitsuAPI() {
  console.log("==================================================");
  console.log("🚀 TESTING KITSU API ENDPOINTS (MAL ID 50668 & 21)");
  console.log("==================================================\n");

  const headers = {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json'
  };

  // Test 1: MAL ID mapping via Kitsu mappings endpoint
  console.log("1. Testing Kitsu mapping for MAL ID 21 (One Piece)...");
  try {
    const res1 = await fetch('https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=21&include=item', { headers });
    console.log(`   -> Status: ${res1.status}`);
    const data1 = await res1.json();
    console.log(`   -> Mappings count: ${data1.data?.length}`);
    if (data1.included && data1.included.length > 0) {
      const item = data1.included[0];
      console.log(`   -> Found Kitsu Anime ID: ${item.id}, Title: ${item.attributes?.canonicalTitle}`);
    }
  } catch (err) {
    console.error(`   -> Mapping error: ${err.message}`);
  }

  // Test 2: MAL ID mapping for 50668
  console.log("\n2. Testing Kitsu mapping for MAL ID 50668 (Witch on the Holy Night)...");
  try {
    const res2 = await fetch('https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=50668&include=item', { headers });
    console.log(`   -> Status: ${res2.status}`);
    const data2 = await res2.json();
    console.log(`   -> Mappings count: ${data2.data?.length}`);
    if (data2.included && data2.included.length > 0) {
      const item = data2.included[0];
      console.log(`   -> Found Kitsu Anime ID: ${item.id}, Title: ${item.attributes?.canonicalTitle}`);
    }
  } catch (err) {
    console.error(`   -> Mapping error: ${err.message}`);
  }

  // Test 3: Kitsu Characters query for One Piece (Kitsu ID 11)
  console.log("\n3. Testing Kitsu Characters for Kitsu Anime ID 11 (One Piece)...");
  try {
    const res3 = await fetch('https://kitsu.io/api/edge/anime/11/characters?include=character&page[limit]=6', { headers });
    console.log(`   -> Status: ${res3.status}`);
    const data3 = await res3.json();
    console.log(`   -> Characters data count: ${data3.data?.length}`);
    console.log(`   -> Included data count: ${data3.included?.length}`);
    if (data3.included && data3.included.length > 0) {
      const sampleChar = data3.included[0];
      console.log(`   -> Sample character: ${sampleChar.attributes?.name}, image: ${sampleChar.attributes?.image?.original}`);
    }
  } catch (err) {
    console.error(`   -> Characters error: ${err.message}`);
  }

  console.log("\n==================================================");
}

testKitsuAPI().catch(console.error);
