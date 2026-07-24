async function testContactAPI() {
  console.log("Testing POST /api/contact...");
  const res = await fetch('http://127.0.0.1:5000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Audit Test User',
      email: 'testuser@example.com',
      message: 'Hello, this is a test message from the final audit script.'
    })
  });
  const data = await res.json();
  console.log(`Status: ${res.status} | Response:`, data);
}

testContactAPI();
