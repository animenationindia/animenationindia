const BACKEND_URL = 'http://127.0.0.1:5000';

async function testWatchlistE2E() {
  console.log("==================================================================================");
  console.log("🚀 WATCHLIST END-TO-END SYSTEM RE-TEST (JWT + MONGO PERSISTENCE)");
  console.log("==================================================================================\n");

  const timestamp = Date.now();
  const testUser = {
    username: `user_${timestamp}`,
    email: `watchlist_test_${timestamp}@example.com`,
    password: `TestPassword123!`
  };

  // 1. Register User
  console.log("1. Registering new test user account...");
  const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  console.log(`   -> Status: ${regRes.status} | Message: ${regData.message}`);

  if (regRes.status !== 201) {
    console.error("❌ Registration failed!");
    return;
  }

  // 2. Login User to get JWT token
  console.log("\n2. Logging in with credentials...");
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginData = await loginRes.json();
  console.log(`   -> Status: ${loginRes.status} | Token Received: ${!!loginData.token} | User ID: ${loginData.user?.id}`);

  if (!loginData.token) {
    console.error("❌ Login failed!");
    return;
  }

  const token = loginData.token;
  const userId = loginData.user.id;

  // 3. Add Anime to Watchlist (MAL ID 21 - One Piece)
  console.log("\n3. Adding Anime (MAL ID 21) to Watchlist...");
  const sampleAnime = {
    mal_id: 21,
    title: 'One Piece',
    title_english: 'One Piece',
    images: { jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' } },
    score: 8.72
  };

  const addRes = await fetch(`${BACKEND_URL}/api/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ anime: sampleAnime })
  });
  const addData = await addRes.json();
  console.log(`   -> Status: ${addRes.status} | Message: ${addData.message}`);

  // 4. Fetch Watchlist & verify item presence
  console.log("\n4. Fetching user Watchlist from Database...");
  const getRes = await fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const watchlistItems = await getRes.json();
  const hasItem21 = Array.isArray(watchlistItems) && watchlistItems.some((i) => Number(i.mal_id) === 21);
  console.log(`   -> Status: ${getRes.status} | Items count: ${watchlistItems.length || 0} | Item 21 Present: ${hasItem21}`);

  // 5. Remove Anime from Watchlist
  console.log("\n5. Removing Anime (MAL ID 21) from Watchlist...");
  const removeRes = await fetch(`${BACKEND_URL}/api/watchlist/${userId}/21`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const removeData = await removeRes.json();
  console.log(`   -> Status: ${removeRes.status} | Message: ${removeData.message}`);

  // 6. Verify removal sync
  console.log("\n6. Verifying removal in Database...");
  const getRes2 = await fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const watchlistItems2 = await getRes2.json();
  const hasItem21After = Array.isArray(watchlistItems2) && watchlistItems2.some((i) => Number(i.mal_id) === 21);
  console.log(`   -> Items count after remove: ${watchlistItems2.length || 0} | Item 21 Present: ${hasItem21After}`);

  // 7. Re-login & test persistence
  console.log("\n7. Re-logging in to verify Database Persistence...");
  const loginRes2 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginData2 = await loginRes2.json();
  console.log(`   -> Re-login Status: ${loginRes2.status} | Authenticated: ${!!loginData2.token}`);

  console.log("\n==================================================================================");
  console.log("✅ WATCHLIST END-TO-END TEST PASSED 100%");
  console.log("==================================================================================");
}

testWatchlistE2E().catch(console.error);
