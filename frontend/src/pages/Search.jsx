import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 🔥 NEW: Search Type Toggle State (Anime or Manga)
  const [searchType, setSearchType] = useState('anime'); 
  
  const navigate = useNavigate();

  // 🔥 PERSONAL DATABASE SAVE LOGIC 🔥
  const addToWatchlist = async (e, item) => {
    e.stopPropagation(); 
    e.preventDefault(); 
    
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert("Please login first to add to your watchlist!");
        navigate('/auth');
        return;
    }

    try {
        const response = await fetch('[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                anime: item, // Backend same 'animeData' object expect korche
                userId: userId
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`🎉 ${item.title_english || item.title} saved to your collection!`);
        } else {
            alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
        }
    } catch (error) {
        console.error("Database error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      // 🔥 DYNAMIC API CALL: based on selected searchType (anime or manga)
      const res = await fetch(`https://api.jikan.moe/v4/${searchType}?q=${query}&limit=24`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
    setLoading(false);
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Search Header & Input */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#fff', marginBottom: '15px' }}>🔍 Find Your Next Favorite</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '20px' }}>Search through thousands of anime series, manga, and novels.</p>
        
        {/* 🔥 NEW: ANIME / MANGA TOGGLE SWITCH 🔥 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
            <button 
               onClick={() => setSearchType('anime')}
               style={{
                   padding: '8px 25px',
                   borderRadius: '99px',
                   border: 'none',
                   fontWeight: 'bold',
                   fontSize: '1rem',
                   cursor: 'pointer',
                   transition: '0.3s',
                   background: searchType === 'anime' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                   color: searchType === 'anime' ? '#fff' : 'var(--text-muted)'
               }}
            >
               Anime
            </button>
            <button 
               onClick={() => setSearchType('manga')}
               style={{
                   padding: '8px 25px',
                   borderRadius: '99px',
                   border: 'none',
                   fontWeight: 'bold',
                   fontSize: '1rem',
                   cursor: 'pointer',
                   transition: '0.3s',
                   background: searchType === 'manga' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                   color: searchType === 'manga' ? '#fff' : 'var(--text-muted)'
               }}
            >
               Manga
            </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <input 
            type="text" 
            placeholder={`Search ${searchType}...`} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '20px 30px', 
              fontSize: '1.2rem', 
              borderRadius: '99px', 
              border: '2px solid rgba(255,255,255,0.05)', 
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff',
              outline: 'none',
              transition: '0.3s'
            }}
            onFocus={(e) => e.target.style.border = '2px solid var(--primary)'}
            onBlur={(e) => e.target.style.border = '2px solid rgba(255,255,255,0.05)'}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', padding: '0 35px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--primary)' }}>
          <i className="fas fa-spinner fa-spin fa-4x"></i>
          <p style={{ marginTop: '20px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Searching the database...</p>
        </div>
      )}

      {/* Search Results Grid */}
      {!loading && hasSearched && searchResults.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <h3 style={{ color: '#fff', marginBottom: '30px', fontSize: '1.5rem', fontWeight: '600' }}>
            Results for <span style={{ color: 'var(--primary)' }}>"{query}"</span>
          </h3>
          
          <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {searchResults.map((item) => (
              <div 
                key={item.mal_id} 
                className="anime-card hover-scale" 
                style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}
                
                // 🔥 DYNAMIC LINK: Goes to /anime/id OR /manga/id based on type
                onClick={() => navigate(`/${searchType}/${item.mal_id}`)}
              >
                <div style={{ position: 'relative', height: '300px' }}>
                    <img src={item.images?.webp?.large_image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {/* Floating Watchlist Button */}
                    <button 
                        onClick={(e) => addToWatchlist(e, item)}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                        <i className="fas fa-bookmark"></i>
                    </button>

                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                        ⭐ {item.score || 'N/A'}
                    </div>
                </div>
                
                <div style={{ padding: '15px' }}>
                  {/* 🔥 TITLE FIX: Prioritize English */}
                  <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '5px' }}>
                    {item.title_english || item.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {item.type || (searchType === 'anime' ? 'TV' : 'Manga')} • {item.status}
                  </div>
                  
                  {/* 🔥 DYNAMIC VIEW DETAILS BUTTON */}
                  <Link 
                    to={`/${searchType}/${item.mal_id}`} 
                    style={{ display: 'block', textAlign: 'center', marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: '0.3s' }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Found */}
      {!loading && hasSearched && searchResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px', opacity: 0.2 }}>
            <i className="fas fa-search-minus"></i>
          </div>
          <h2 style={{ color: '#fff', fontSize: '2rem' }}>No matches found for "{query}"</h2>
          <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>We couldn't find anything. Double check your spelling or try another title.</p>
        </div>
      )}

    </div>
  );
};

export default Search;