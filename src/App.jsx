import { useState, useEffect, useCallback, useRef } from 'react';
import { tmdbApi } from './services/tmdbApi';
import { getGenreNames, GENRE_MAP } from './utils/genres';
import MovieModal from './components/MovieModal';
import SkeletonCard from './components/SkeletonCard';

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const [toasts, setToasts] = useState([]);

  const triggerToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("ui-theme");
    return savedTheme ? savedTheme : "dark";
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
    triggerToast(`Switched to ${theme === "dark" ? 'Light Mode' : 'Dark Mode'}`, "info");
  };

  useEffect(() => {
    localStorage.setItem("ui-theme", theme);
  }, [theme]);

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("movie-watchlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem("movie-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, selectedGenre]);

  const fetchMovies = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      setError(null);

      let fetchedResults = [];
      const API_KEY = "ad1f5faef88f724d76f574ea81ba8632";
      const BASE_URL = "https://api.themoviedb.org/3";

      if (searchQuery.trim() === "") {
        const genreParam = selectedGenre ? `&with_genres=${selectedGenre}` : '';
        const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${pageNum}${genreParam}`);
        if (!response.ok) throw new Error("Failed to fetch movies");
        const data = await response.json();
        fetchedResults = data.results;
      } else {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US&page=${pageNum}`);
        if (!response.ok) throw new Error("Search query failed");
        const data = await response.json();
        fetchedResults = data.results;
      }

      if (fetchedResults.length === 0) {
        setHasMore(false);
      } else {
        setMovies(prev => pageNum === 1 ? fetchedResults : [...prev, ...fetchedResults]);
      }
    } catch (err) {
      setError("Could not connect to the movie database. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre]);

  useEffect(() => {
    if (showWatchlistOnly) return;
    const delayDebounce = setTimeout(() => {
      fetchMovies(page);
    }, searchQuery.trim() === "" ? 0 : 500);

    return () => clearTimeout(delayDebounce);
  }, [fetchMovies, page, showWatchlistOnly]);

  useEffect(() => {
    if (showWatchlistOnly || !hasMore || loading) return;

    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [showWatchlistOnly, hasMore, loading]);

  const toggleWatchlist = (e, movie) => {
    e.stopPropagation();
    const isSaved = watchlist.some(item => item.id === movie.id);
    if (isSaved) {
      setWatchlist(watchlist.filter(item => item.id !== movie.id));
      triggerToast(`Removed "${movie.title}" from your watchlist`, "error");
    } else {
      setWatchlist([...watchlist, movie]);
      triggerToast(`Added "${movie.title}" to your watchlist!`, "success");
    }
  };

  const getWatchlistAnalytics = () => {
    if (watchlist.length === 0) return { avgRating: "0.0", topGenre: "None" };

    const avgRating = (watchlist.reduce((acc, curr) => acc + curr.vote_average, 0) / watchlist.length).toFixed(1);

    const genreCounts = {};
    watchlist.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(id => {
          const name = GENRE_MAP[id];
          if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
        });
      }
    });

    let topGenre = "None";
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenre = genre;
      }
    });

    return { avgRating, topGenre, total: watchlist.length };
  };

  const analytics = getWatchlistAnalytics();

  const getProcessedMovies = () => {
    let list = showWatchlistOnly ? [...watchlist] : [...movies];

    if (selectedGenre && (showWatchlistOnly || searchQuery.trim() !== "")) {
      list = list.filter(m => m.genre_ids && m.genre_ids.includes(Number(selectedGenre)));
    }

    if (showWatchlistOnly && searchQuery.trim() !== "") {
      list = list.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sortBy === "rating") {
      list.sort((a, b) => b.vote_average - a.vote_average);
    } else if (sortBy === "date") {
      list.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    } else if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  };

  const displayedMovies = getProcessedMovies();
  const isDark = theme === "dark";

  const formatFullDate = (dateString) => {
    if (!dateString) return "Unknown";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 relative ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-2xl font-medium text-sm border flex items-center gap-2 transform translate-y-0 animate-bounce text-white ${toast.type === "success" ? "bg-emerald-600 border-emerald-500" :
              toast.type === "error" ? "bg-rose-600 border-rose-500" : "bg-cyan-600 border-cyan-500"
              }`}
          >
            {toast.type === "success" && "✨"}
            {toast.type === "error" && "🗑️"}
            {toast.type === "info" && "ℹ️"}
            {toast.message}
          </div>
        ))}
      </div>

      <header className={`mb-8 border-b pb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>🎬 Movie Explorer </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"Discover, track, and curate your ultimate watchlist."</p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:w-auto">
          <button
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-lg border transition text-sm font-medium flex items-center justify-center gap-2 h-10 w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <div className={`flex p-1 rounded-lg border h-10 items-center w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
            <button
              onClick={() => { setShowWatchlistOnly(false); setSelectedGenre(""); }}
              className={`px-4 py-1 h-full rounded-md text-sm font-medium transition ${!showWatchlistOnly ? (isDark ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-600 text-white') : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
            >
              All Feeds
            </button>
            <button
              onClick={() => { setShowWatchlistOnly(true); setSelectedGenre(""); }}
              className={`px-4 py-1 h-full rounded-md text-sm font-medium transition ${showWatchlistOnly ? (isDark ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-600 text-white') : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
            >
              Watchlist ({watchlist.length})
            </button>
          </div>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className={`px-3 py-2 border rounded-lg text-sm h-10 cursor-pointer w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
          >
            <option value="">Filter by Genre: All</option>
            {Object.entries(GENRE_MAP).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          {!showWatchlistOnly && (
            <div className="relative w-full sm:w-48 lg:w-56 h-10">
              <input
                type="text"
                placeholder="Search matching items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-4 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm h-full w-full ${isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer font-bold"
                  title="Clear search text"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 border rounded-lg text-sm h-10 cursor-pointer w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
          >
            <option value="popularity">Sort by: Popularity</option>
            <option value="rating">Sort by: Rating (High - Low)</option>
            <option value="date">Sort by: Release Date</option>
            <option value="title">Sort by: Alphabetical (A-Z)</option>
          </select>
        </div>
      </header>

      {showWatchlistOnly && watchlist.length > 0 && (
        <div className={`mb-6 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 text-center items-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
          <div className="border-r border-slate-700/50 last:border-none py-2">
            <span className={`block text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Tracked</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{analytics.total} Movies</span>
          </div>
          <div className="border-r border-slate-700/50 last:border-none py-2">
            <span className={`block text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mean Metric Rating</span>
            <span className="text-2xl font-extrabold text-amber-500">⭐ {analytics.avgRating}</span>
          </div>
          <div className="border-r border-slate-700/50 last:border-none py-2">
            <span className={`block text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dominant Genre Profile</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{analytics.topGenre}</span>
          </div>
          <div className="py-2 flex justify-center">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to completely clear your watchlist?")) {
                  setWatchlist([]);
                  triggerToast("Watchlist cleared successfully", "error");
                }
              }}
              className="px-4 py-1.5 text-xs bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-600 hover:text-white transition font-semibold cursor-pointer"
            >
              🗑️ Wipe Watchlist
            </button>
          </div>
        </div>
      )}

      {error && !showWatchlistOnly && movies.length === 0 && (
        <div className={`text-center py-20 border rounded-2xl max-w-md mx-auto p-6 ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <p className="text-red-500 font-semibold text-lg mb-4">{error}</p>
          <button onClick={() => fetchMovies(page)} className={`px-5 py-2 font-medium rounded-lg transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
            🔄 Retry Connection
          </button>
        </div>
      )}

      <main>
        {/* Shows warning ONLY if absolutely nothing was found */}
        {!loading && displayedMovies.length === 0 && (
          <div className="text-center py-20 w-full">
            <p className={`text-xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {showWatchlistOnly
                ? "📚 Filter subset criteria returned empty matches inside Watchlist storage."
                : "🔍 No movies found matching criteria."}
            </p>
          </div>
        )}

        {/* FIXED: Removed the !loading check so existing movies never disappear while fetching more */}
        {displayedMovies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {displayedMovies.map((movie, index) => {
              const isSaved = watchlist.some(item => item.id === movie.id);
              const uniqueKey = movie.id ? `movie-card-${movie.id}-${index}` : `movie-fallback-${index}`;

              return (
                <div
                  key={uniqueKey}
                  onClick={() => setSelectedMovieId(movie.id)}
                  className={`relative rounded-xl overflow-hidden shadow-lg border p-4 flex flex-col justify-between transition cursor-pointer group ${isDark ? 'bg-slate-800 border-slate-700 hover:border-cyan-400' : 'bg-white border-slate-200 hover:border-cyan-600 hover:shadow-xl'
                    }`}
                >
                  <button
                    onClick={(e) => toggleWatchlist(e, movie)}
                    className={`absolute top-6 right-6 z-10 p-2.5 rounded-full border transition shadow-md ${isDark ? 'bg-slate-900/90 border-slate-700 hover:bg-cyan-500 hover:text-slate-900' : 'bg-white/90 border-slate-200 hover:bg-cyan-600 hover:text-white'
                      }`}
                    title={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSaved ? (isDark ? "#22d3ee" : "#0891b2") : "none"} stroke={isSaved ? (isDark ? "#22d3ee" : "#0891b2") : "currentColor"} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <div>
                    <img
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                      alt={movie.title}
                      className="w-full h-72 object-cover rounded-lg mb-4 group-hover:scale-[1.02] transition duration-300"
                    />
                    <h2 className="text-xl font-bold mb-1 line-clamp-1">{movie.title}</h2>
                    <p className={`text-sm mb-2 font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>{getGenreNames(movie.genre_ids)}</p>
                    <p className={`text-xs line-clamp-3 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{movie.overview || "No description available."}</p>
                  </div>

                  <div className={`flex justify-between items-center text-sm font-medium border-t pt-3 mt-2 ${isDark ? 'border-slate-700' : 'border-slate-150'}`}>
                    <span className="text-amber-500">⭐ {movie.vote_average?.toFixed(1) || "N/A"}</span>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      {formatFullDate(movie.release_date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Shimmer layout now naturally appends to the bottom of the active list while fetching */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`skeleton-card-${i}`} />
            ))}
          </div>
        )}

        {!showWatchlistOnly && hasMore && <div ref={observerTarget} className="h-10 w-full" />}
      </main>

      {selectedMovieId && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}

      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-20 right-5 z-40 p-3 rounded-full shadow-2xl transition-all duration-300 border focus:outline-none cursor-pointer transform hover:scale-110 active:scale-95 ${isDark
            ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300'
            : 'bg-white border-slate-300 text-cyan-600 hover:bg-slate-100 hover:text-cyan-700'
            }`}
          title="Back to Top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
          </svg>
        </button>
      )}

    </div>
  );
}

export default App;
