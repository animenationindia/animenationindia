/**
 * Automated Live API Health-Check Script
 * Anime Nation India - Backend Diagnostic Tool
 *
 * Measures response latency (ms), checks HTTP 200 OK,
 * validates JSON payloads, and prints a formatted summary table.
 *
 * Usage:
 *   node backend/scripts/healthCheck.js
 */

const ENDPOINTS = [
  {
    name: 'Genres Catalog',
    url: 'https://animenationindia.onrender.com/api/genres'
  },
  {
    name: 'Trending Anime',
    url: 'https://animenationindia.onrender.com/api/trending'
  },
  {
    name: 'Trailers Feed',
    url: 'https://animenationindia.onrender.com/api/trailers'
  }
];

async function runHealthCheck() {
  console.log('='.repeat(72));
  console.log(' 🩺 ANIME NATION INDIA — RENDER LIVE BACKEND HEALTH CHECK');
  console.log(' Timestamp :', new Date().toISOString());
  console.log(' Target    :', 'https://animenationindia.onrender.com');
  console.log('='.repeat(72));

  const results = [];

  for (const ep of ENDPOINTS) {
    process.stdout.write(`Testing ${ep.name.padEnd(20)} ... `);
    const start = performance.now();

    try {
      const response = await fetch(ep.url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(30000) // 30s timeout to account for Render cold-starts
      });
      const latency = Math.round(performance.now() - start);

      let isJson = false;
      let itemCount = 0;
      let errorDetail = null;

      if (response.ok) {
        try {
          const json = await response.json();
          isJson = true;

          if (Array.isArray(json)) {
            itemCount = json.length;
          } else if (json && Array.isArray(json.data)) {
            itemCount = json.data.length;
          } else if (json && typeof json === 'object') {
            itemCount = Object.keys(json).length;
          }
        } catch {
          errorDetail = 'Invalid JSON payload received';
        }
      } else {
        errorDetail = `HTTP ${response.status} ${response.statusText}`;
      }

      const passed = response.status === 200 && isJson;

      results.push({
        endpoint: ep.name,
        url: ep.url,
        status: response.status,
        latency: `${latency} ms`,
        validJson: isJson ? 'YES' : 'NO',
        payloadItems: itemCount,
        health: passed ? 'HEALTHY' : 'DEGRADED',
        error: errorDetail
      });

      console.log(passed ? `✅ 200 OK (${latency}ms)` : `❌ FAIL (${response.status})`);
    } catch (err) {
      const latency = Math.round(performance.now() - start);

      results.push({
        endpoint: ep.name,
        url: ep.url,
        status: 'CONN_ERR',
        latency: `${latency} ms`,
        validJson: 'NO',
        payloadItems: 0,
        health: 'FAILED',
        error: err.message
      });

      console.log(`❌ ERROR (${err.message})`);
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(' 📊 SUMMARY AUDIT TABLE');
  console.log('='.repeat(72));

  console.table(
    results.map(r => ({
      Endpoint: r.endpoint,
      Status: r.status,
      Latency: r.latency,
      'Valid JSON': r.validJson,
      'Payload Items': r.payloadItems,
      Health: r.health
    }))
  );

  const allPassed = results.every(r => r.health === 'HEALTHY');

  console.log('='.repeat(72));
  console.log(
    ' Overall Status:',
    allPassed
      ? '🟢 ALL ENDPOINTS PASSING & HEALTHY'
      : '🔴 ONE OR MORE ENDPOINTS FAILED'
  );
  console.log('='.repeat(72));

  if (!allPassed) {
    process.exitCode = 1;
  }
}

runHealthCheck();
