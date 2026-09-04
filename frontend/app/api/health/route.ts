export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {};

  const tests: { name: string; headers: Record<string, string> }[] = [
    { name: 'bare', headers: { 'Content-Type': 'application/json' } },
    { name: 'bare_accept', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } },
    { name: 'app_ua', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'AnimeNationIndia/1.0' } },
    { name: 'browser_ua', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }
  ];

  for (const t of tests) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: t.headers,
        body: JSON.stringify({
          query: 'query { Page(page: 1, perPage: 1) { media(type: ANIME) { id title { romaji } } } }'
        })
      });
      const text = await res.text();
      diagnostics[t.name] = {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        bodySnippet: text.slice(0, 150)
      };
    } catch (err: any) {
      diagnostics[t.name] = { error: err.message };
    }
  }

  return Response.json(diagnostics);
}
