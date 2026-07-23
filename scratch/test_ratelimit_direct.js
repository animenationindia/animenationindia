const http = require('http');

async function testRateLimit() {
  console.log('Testing Login Rate Limiter (12 requests to /api/auth/login from local IP)...');
  for (let i = 1; i <= 12; i++) {
    await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`Req ${i}: Status = ${res.statusCode}, Body = ${data}`);
          resolve();
        });
      });
      req.write(JSON.stringify({ email: 'testratelimit@example.com', password: 'password123' }));
      req.end();
    });
  }
}

testRateLimit();
