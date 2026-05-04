import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const LatestTrailersSection = () => {
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    // 🔥 AniList GraphQL Fetcher 🔥
    const fetchAniListTrailers = async () => {
      const query = `
        query {
          Page(page: 1, perPage: 15) {
            media(sort: TRENDING_DESC, type: ANIME) {
              id
              title { english romaji }
              trailer { id site }
            }
          }
        }
      `;
      try {
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await response.json();
        
        if (data?.data?.Page?.media) {
            // Shudhu YouTube er trailer guloi filter korbo
            const validTrailers = data.data.Page.media.filter(anime => anime.trailer && anime.trailer.site === "youtube");
            setTrailers(validTrailers.slice(0, 8)); // Top 8 ta dekhabo
        }
      } catch (error) {
        console.error("AniList Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAniListTrailers();
  }, []);

  // 🚀 AUTOMATIC SIDE SCROLL LOGIC 🚀
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // Jodi ekdom seshe chole jay, abar prothom theke shuru korbe
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 3500); // Prottek 3.5 second e scroll hobe
    return () => clearInterval(interval);
  }, []);

  const manualScroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  return (
    <section className="carousel-section" style={{ marginTop: '3rem' }}>
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title">🎬 Latest Anime Trailers</h2>
          <p className="section-sub">Watch the newest trending promos.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => manualScroll('left')} style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}><i className="fas fa-chevron-left"></i></button>
             <button onClick={() => manualScroll('right')} style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}><i className="fas fa-chevron-right"></i></button>
          </div>
          <Link to="/trailers" className="view-all-btn" style={{ textDecoration: 'none' }}>View All</Link>
        </div>
      </div>

      <div ref={scrollRef} className="poster-row hide-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: '20px', paddingBottom: '10px', scrollBehavior: 'smooth' }}>
        {loading ? (
           <div style={{ color: 'var(--text-muted)', padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> Loading AniList Trailers...</div>
        ) : trailers.length > 0 ? (
          trailers.map((anime, index) => (
            <div key={anime.id} className="poster-card hover-scale" style={{ flex: '0 0 300px', background: 'transparent' }}>
              <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src={`https://www.youtube.com/embed/${anime.trailer.id}`} title={anime.title.english || anime.title.romaji} frameBorder="0" allowFullScreen loading="lazy"></iframe>
              </div>
              <div className="poster-meta" style={{ padding: '0.8rem 0.2rem' }}>
                {/* 🌟 FORCE ENGLISH TITLE 🌟 */}
                <div className="poster-title" style={{ fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {anime.title.english || anime.title.romaji}
                </div>
                <div className="poster-cat" style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>Official Trailer</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-muted)', padding: '20px' }}>No trailers available right now.</div>
        )}
      </div>
    </section>
  );
};

export default LatestTrailersSection;