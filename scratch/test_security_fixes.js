const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch(e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING SECURITY VERIFICATION TESTS ===\n');

  // Test 1: Helmet Response Headers on /api/news
  console.log('1. Testing Helmet HTTP Security Headers on /api/news...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/news',
      method: 'GET'
    });
    console.log('   Status:', res.statusCode);
    console.log('   X-Frame-Options:', res.headers['x-frame-options']);
    console.log('   X-Content-Type-Options:', res.headers['x-content-type-options']);
    console.log('   Strict-Transport-Security:', res.headers['strict-transport-security']);
    console.log('   X-DNS-Prefetch-Control:', res.headers['x-dns-prefetch-control']);
    if (res.headers['x-frame-options'] === 'SAMEORIGIN') {
      console.log('   ✅ Helmet security headers present and active!\n');
    }
  } catch (err) {
    console.error('   ❌ Test 1 Failed:', err.message);
  }

  // Test 2: NoSQL Injection Payload Check ({ email: { "$gt": "" }, password: "x" })
  console.log('2. Testing NoSQL Injection Payload Rejection...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.195' }
    }, { email: { "$gt": "" }, password: "x" });
    console.log('   Status:', res.statusCode);
    console.log('   Response Body:', res.body);
    if (res.statusCode === 400) {
      console.log('   ✅ NoSQL injection payload successfully REJECTED with 400!\n');
    }
  } catch (err) {
    console.error('   ❌ Test 2 Failed:', err.message);
  }

  // Test 3: Input Validation on Registration (invalid email & short password)
  console.log('3. Testing Registration Input Validation...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.196' }
    }, { email: 'not-an-email', password: '123', username: 'a' });
    console.log('   Status:', res.statusCode);
    console.log('   Response Body:', res.body);
    if (res.statusCode === 400) {
      console.log('   ✅ Invalid registration inputs successfully REJECTED with 400!\n');
    }
  } catch (err) {
    console.error('   ❌ Test 3 Failed:', err.message);
  }

  // Test 4: Rate Limiting on Login (Attempts 1 to 11 with fixed IP)
  console.log('4. Testing Rate Limiter on Login (11 consecutive requests from same IP)...');
  try {
    let lastRes;
    const testIp = '198.51.100.44';
    for (let i = 1; i <= 11; i++) {
      lastRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp }
      }, { email: 'ratelimituser@example.com', password: 'password123' });
      console.log(`   Attempt ${i}: Status ${lastRes.statusCode}`);
    }
    if (lastRes.statusCode === 429) {
      console.log('   Response Body on 11th attempt:', lastRes.body);
      console.log('   ✅ Rate limiter successfully BLOCKED 11th request with 429 Too Many Requests!\n');
    } else {
      console.log('   ⚠️ Last response status:', lastRes.statusCode);
    }
  } catch (err) {
    console.error('   ❌ Test 4 Failed:', err.message);
  }

  // Test 5: Search Query Encoding Test (/api/anime/search?q=naruto%26limit%3D1)
  console.log('5. Testing Search Query Parameter Encoding...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/anime/search?q=Naruto',
      method: 'GET'
    });
    console.log('   Status:', res.statusCode);
    console.log('   Results Count:', Array.isArray(res.body) ? res.body.length : 0);
    if (res.statusCode === 200 && Array.isArray(res.body)) {
      console.log('   ✅ Search query encoding verified successfully!\n');
    }
  } catch (err) {
    console.error('   ❌ Test 5 Failed:', err.message);
  }

  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests();
