import React from 'react';

const FAQ = () => {
  const faqs = [
    { q: "Is Anime Nation India free to use?", a: "Yes! Creating an account, tracking your watchlist, and reading news is 100% free." },
    { q: "Where does the anime data come from?", a: "We use the public Jikan API (MyAnimeList) and AniList GraphQL to provide the most accurate and up-to-date database." },
    { q: "Can I watch anime directly on this site?", a: "No. Anime Nation India is a tracking and discovery platform. We provide official trailer links, but we do not host pirated video content." },
    { q: "How do I add anime to my Watchlist?", a: "You need to create an account first. Once logged in, click the Bookmark icon on any anime card to save it to your personal database." }
  ];

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh', paddingLeft: '20px', paddingRight: '20px' }}>
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>{faq.q}</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{faq.a}</p>
              </div>
          ))}
      </div>
    </div>
  );
};
export default FAQ;