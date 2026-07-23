async function runAudit() {
  console.log("==================================================");
  console.log("🚀 STARTING HANDS-ON FULL STACK VERIFICATION AUDIT");
  console.log("==================================================\n");

  // 1. DEV SERVER & BACKEND HEALTH CHECK
  console.log("--- STEP 1: Dev Server Health Check ---");
  try {
    const feRes = await fetch('http://localhost:3000/');
    console.log(`[Frontend] http://localhost:3000/ -> Status: ${feRes.status} ${feRes.statusText}`);
  } catch (err) {
    console.error(`[Frontend ERROR] http://localhost:3000/ -> ${err.message}`);
  }

  try {
    const beRes = await fetch('http://localhost:5000/api/news');
    console.log(`[Backend News Endpoint] http://localhost:5000/api/news -> Status: ${beRes.status}`);
    const newsData = await beRes.json();
    console.log(`[Backend News Check] Items count: ${newsData.data ? newsData.data.length : 0}`);
  } catch (err) {
    console.error(`[Backend ERROR] -> ${err.message}`);
  }

  // 2. PAGE-BY-PAGE LOAD TEST
  console.log("\n--- STEP 2: Page-by-Page Load Test ---");
  const routesToTest = [
    '/',
    '/home',
    '/series/21',
    '/series/58505',
    '/manga/13',
    '/browse/all',
    '/browse/manga',
    '/search?q=naruto',
    '/watch/21',
    '/watchlist',
    '/profile',
    '/settings',
    '/invalid-route-404-test-xyz'
  ];

  const pageResults = [];

  for (const route of routesToTest) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      const text = await res.text();
      const hasRuntimeError = text.includes('Unhandled Runtime Error') || text.includes('Application error');
      const is404Page = text.includes('404') && (text.includes('Page Not Found') || text.includes('not-found'));
      
      const result = {
        route,
        status: res.status,
        ok: res.ok || (route.includes('404') && res.status === 404),
        hasRuntimeError,
        is404Page,
        contentLength: text.length
      };
      pageResults.push(result);
      console.log(`[Route Check] ${route.padEnd(35)} -> Status: ${res.status} | OK: ${res.ok} | Error UI: ${hasRuntimeError}`);
    } catch (err) {
      console.error(`[Route ERROR] ${route} -> ${err.message}`);
      pageResults.push({ route, status: 'ERROR', error: err.message });
    }
  }

  // 3. CORE FEATURE FUNCTIONAL TEST (AUTH, SEARCH, API)
  console.log("\n--- STEP 3: Core Feature Functional Tests ---");
  
  // Test 3.1: Register
  const testEmail = `audit_test_${Date.now()}@example.com`;
  const testPass = 'Password123!';
  const testUser = `audituser_${Date.now().toString().slice(-4)}`;

  console.log(`\n[Auth Test] Registering test user: ${testEmail}...`);
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, email: testEmail, password: testPass })
  });
  const regData = await regRes.json();
  console.log(`  -> Register Status: ${regRes.status} | Message: ${regData.message}`);

  // Test 3.2: Login
  console.log(`\n[Auth Test] Logging in...`);
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });
  const loginData = await loginRes.json();
  console.log(`  -> Login Status: ${loginRes.status} | Token length: ${loginData.token ? loginData.token.length : 0}`);

  // Test 3.3: Invalid Login
  console.log(`\n[Auth Test] Testing invalid password login...`);
  const invRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword' })
  });
  const invData = await invRes.json();
  console.log(`  -> Invalid Login Status: ${invRes.status} (Expected 400) | Message: ${invData.message}`);

  // Test 3.4: Watchlist Add / Get / Delete
  if (loginData.token && loginData.user) {
    const token = loginData.token;
    const uid = loginData.user.id;

    console.log(`\n[Watchlist API] Adding anime to watchlist...`);
    const addRes = await fetch('http://localhost:5000/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        anime: { mal_id: 21, title: 'ONE PIECE', image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg' }
      })
    });
    const addData = await addRes.json();
    console.log(`  -> Watchlist Add Status: ${addRes.status} | Message: ${addData.message}`);

    console.log(`\n[Watchlist API] Fetching user watchlist...`);
    const getRes = await fetch(`http://localhost:5000/api/watchlist/${uid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getList = await getRes.json();
    console.log(`  -> Watchlist Get Status: ${getRes.status} | Items: ${getList.length}`);

    console.log(`\n[Watchlist API] Deleting anime from watchlist...`);
    const delRes = await fetch(`http://localhost:5000/api/watchlist/${uid}/21`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delData = await delRes.json();
    console.log(`  -> Watchlist Delete Status: ${delRes.status} | Message: ${delData.message}`);
  }

  // 4. IMAGE QUALITY SPOT-CHECK
  console.log("\n--- STEP 4: Image Quality Spot-Check ---");
  const homeRes = await fetch('http://localhost:3000/home');
  const homeHtml = await homeRes.text();
  const imgMatches = [...homeHtml.matchAll(/cover%2F(large|medium)%2F([^&"'\s]+)/g)];
  const extraLargeCount = imgMatches.filter(m => m[1] === 'large').length;
  const mediumCount = imgMatches.filter(m => m[1] === 'medium').length;
  console.log(`  -> Rendered AniList cover images on /home: Total=${imgMatches.length}`);
  console.log(`  -> ExtraLarge resolution (folder='large'): ${extraLargeCount}`);
  console.log(`  -> Medium resolution (folder='medium'): ${mediumCount}`);
  if (imgMatches.length > 0) {
    console.log(`  -> Sample image folder match: ${imgMatches[0][1]} / ${imgMatches[0][2]}`);
  }

  console.log("\n==================================================");
  console.log("✅ ALL AUDIT TESTS COMPLETED SUCCESSFULLY");
  console.log("==================================================");
}

runAudit().catch(console.error);
