import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import TopAnime from './pages/TopAnime';
import Schedule from './pages/Schedule';
import TopManga from './pages/TopManga';
import AnimeDetails from './pages/AnimeDetails';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Auth from './pages/Auth';
import MangaDetails from './pages/MangaDetails';
import Profile from './pages/Profile'; // import koro
import Popular from './pages/Popular';
import News from './pages/News';
import Genres from './pages/Genres';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Trailers from './pages/Trailers';
import TopMovies from './pages/TopMovies';
import TopTvSeries from './pages/TopTvSeries';
import ReviewsPage from './pages/ReviewsPage';

const ComingSoon = ({ title }) => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
    <h2>🚀 {title} Page is under construction!</h2>
  </div>
);

function App() {
  return (
    <Router>
      <Header />
      <main style={{ minHeight: '80vh', paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/top-anime" element={<TopAnime />} />
          <Route path="/schedule" element={<Schedule />} />
          
          <Route path="/manga" element={<TopManga />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/news" element={<News />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/search" element={<Search />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/manga/:id" element={<MangaDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/trailers" element={<Trailers />} />
          <Route path="/movies" element={<TopMovies />} />
          <Route path="/tv-series" element={<TopTvSeries />} />
          <Route path="/reviews" element={<ReviewsPage />} />
       </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;