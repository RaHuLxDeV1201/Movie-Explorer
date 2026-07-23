// --- Imports ---
// Standard React hooks for state management, side effects, memoization, and mutable references
import { useState, useEffect, useCallback, useRef } from 'react';
// API service and utility functions
import { tmdbApi } from './services/tmdbApi';
import { getGenreNames, GENRE_MAP } from './utils/genres';
// Custom UI components
import MovieModal from './components/MovieModal';
import SkeletonCard from './components/SkeletonCard';

function App() {
  // --- Core State Variables ---
  const [movies, setMovies] = useState([]); // Stores fetched movies
  const [searchQuery, setSearchQuery] = useState(""); // Current text in the search bar
  const [sortBy, setSortBy] = useState("popularity"); // Current sorting criteria
  const [selectedGenre, setSelectedGenre] = useState(""); // Current genre filter

  // --- UI/Loading State Variables ---
  const [loading, setLoading] = useState(true); // Tracks active network requests
  const [error, setError] = useState(null); // Stores error messages if API fails
  const [selectedMovieId, setSelectedMovieId] = useState(null); // Tracks which movie is open in the modal
  const [showTopBtn, setShowTopBtn] = useState(false); // Controls visibility of "Back to Top" button

  // --- Scroll Event Listener ---
  // Shows the "Back to Top" button when the user scrolls down past 400px
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Cleanup listener on component unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smoothly scrolls the window back to the very top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // --- Toast Notification System ---
  const [toasts, setToasts] = useState([]); // Array to track active pop-up notifications

  // Adds a new toast message and auto-removes it after 3 seconds
  const triggerToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // --- Infinite Scrolling State & Refs ---
  const [page, setPage] = useState(1); // Current API page number
  const [hasMore, setHasMore] = useState(true); // Determines if more pages exist to fetch
  const observerTarget = useRef(null); // Reference to the empty div at the bottom of the list
  const isFetchingRef = useRef(false); // Prevents duplicate concurrent fetches

  // --- Theme Management ---
  // Initialize theme from localStorage, defaulting to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("ui-theme");
    return savedTheme ? savedTheme : "dark";
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
    triggerToast(`Switched to ${theme === "dark" ? 'Light Mode' : 'Dark Mode'}`, "info");
  };

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem("ui-theme", theme);
  }, [theme]);

  // --- Watchlist Management ---
  // Initialize watchlist from localStorage, defaulting to an empty array
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("movie-watchlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false); // Toggles between all movies and watchlist

  // Persist watchlist changes to localStorage
  useEffect(() => {
    localStorage.setItem("movie-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // --- API Fetching Logic ---
  // Reset pagination and clear current movies whenever search query or genre changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, selectedGenre]);

  // Fetches movies from TMDB (Wrapped in useCallback so it's not recreated on every render)
  const fetchMovies = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      setError(null);

      let fetchedResults = [];
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const BASE_URL = "https://api.themoviedb.org/3";

      // If search is empty, fetch popular movies (with optional genre filter)
      if (searchQuery.trim() === "") {
        const genreParam = selectedGenre ? `&with_genres=${selectedGenre}` : '';
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${pageNum}${genreParam}`);
        if (!response.ok) throw new Error("Failed to fetch movies");
        const data = await response.json();
        fetchedResults = data.results;
      } else {
        // If there's a search query, hit the search endpoint instead
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US&page=${pageNum}`);
        if (!response.ok) throw new Error("Search query failed");
        const data = await response.json();
        fetchedResults = data.results;
      }

      // Check if we've hit the end of the results
      if (fetchedResults.length === 0) {
        setHasMore(false);
      } else {
        // If it's page 1, replace movies. Otherwise, append new movies to the existing list.
        setMovies(prev => pageNum === 1 ? fetchedResults : [...prev, ...fetchedResults]);
      }
    } catch (err) {
      setError("Could not connect to the movie database. Please check your network connection.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false; // Release the fetch lock
    }
  }, [searchQuery, selectedGenre]);

  // Trigger fetch when page changes. Includes a 500ms debounce for search queries to prevent spamming the API.
  useEffect(() => {
    // Don't fetch from API if we are only viewing the local watchlist or if there's no more data
    if (showWatchlistOnly || !hasMore) return;

    if (page === 1 && searchQuery.trim() !== "") {
      const delayDebounce = setTimeout(() => {
        fetchMovies(page);
      }, 500);
      return () => clearTimeout(delayDebounce); // Cleanup previous timeout if user keeps typing
    } else {
      fetchMovies(page);
    }
  }, [page, fetchMovies, showWatchlistOnly, hasMore]);

  // --- Infinite Scroll Implementation ---
  // Watches the 'observerTarget' div at the bottom of the page to trigger the next page load
  useEffect(() => {
    if (showWatchlistOnly || !hasMore || loading) return;

    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      entries => {
        // If the target is visible on screen, and we aren't currently fetching, increment the page
        if (entries[0].isIntersecting && !isFetchingRef.current && !loading) {
          isFetchingRef.current = true;
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 } // Triggers when 10% of the target is visible
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect(); // Cleanup observer on unmount
    };
  }, [showWatchlistOnly, hasMore, loading]);

  // --- Actions ---
  // Handles adding/removing a movie from the user's watchlist
  const toggleWatchlist = (e, movie) => {
    e.stopPropagation(); // Prevents the card click event (which opens the modal) from firing
    const isSaved = watchlist.some(item => item.id === movie.id);

    if (isSaved) {
      const updatedWatchlist = watchlist.filter(item => item.id !== movie.id);
      setWatchlist(updatedWatchlist);
      triggerToast(`Removed "${movie.title}" from your watchlist`, "error");

      // Auto-Redirect UX logic: If they remove the last item while viewing the watchlist, return to 'All Feeds'
      if (showWatchlistOnly && updatedWatchlist.length === 0) {
        setShowWatchlistOnly(false);
        setSelectedGenre("");
        setSearchQuery("");
      }
    } else {
      setWatchlist([...watchlist, movie]);
      triggerToast(`Added "${movie.title}" to your watchlist!`, "success");
    }
  };

  // --- Data Processing ---
  // Calculates statistics for the user's watchlist (Average Rating & Top Genre)
  const getWatchlistAnalytics = () => {
    if (watchlist.length === 0) return { avgRating: "0.0", topGenre: "None" };

    const avgRating = (watchlist.reduce((acc, curr) => acc + curr.vote_average, 0) / watchlist.length).toFixed(1);

    // Count occurrences of each genre ID
    const genreCounts = {};
    watchlist.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(id => {
          const name = GENRE_MAP[id];
          if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
        });
      }
    });

    // Find the genre with the highest count
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

  // Applies search filters, genre filters, and sorting to the array currently being viewed
  const getProcessedMovies = () => {
    // Base list depends on whether we are viewing All Feeds or Watchlist
    let list = showWatchlistOnly ? [...watchlist] : [...movies];

    // Note: API already filters genres and search queries for "All Feeds", 
    // so these manual filters mostly apply to the Watchlist view.
    if (showWatchlistOnly && selectedGenre) {
      list = list.filter(m => m.genre_ids && m.genre_ids.includes(Number(selectedGenre)));
    }

    if (showWatchlistOnly && searchQuery.trim() !== "") {
      list = list.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply Sorting logic
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

  // ==========================================
  //                JSX RENDER
  // ==========================================
  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 relative ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* --- Toasts Container --- */}
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

      {/* --- Top Navbar/Header --- */}
      <header className={`mb-8 border-b pb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>🎬 Movie Explorer </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"Discover, track, and curate your ultimate watchlist."</p>
        </div>

        {/* --- Header Controls (Theme, Views, Filters, Search, Sort) --- */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:w-auto">

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-lg border transition text-sm font-medium flex items-center justify-center gap-2 h-10 w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Feed Switcher (All Feeds vs Watchlist) */}
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

          {/* Genre Dropdown Filter */}
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

          {/* Search Bar (Hidden when inside Watchlist View to prevent confusion based on UX choice) */}
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
              {/* Clear Search Button */}
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

          {/* Sort Selection Dropdown */}
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

      {/* --- Watchlist Analytics Dashboard --- */}
      {/* Renders only when on the Watchlist page and there's data to show */}
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
            {/* Clear All Watchlist Data Button */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to completely clear your watchlist?")) {
                  setWatchlist([]);
                  triggerToast("Watchlist cleared successfully", "error");

                  // Navigate user back to main feed
                  setShowWatchlistOnly(false);
                  setSelectedGenre("");
                  setSearchQuery("");
                }
              }}
              className="px-4 py-1.5 text-xs bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-600 hover:text-white transition font-semibold cursor-pointer"
            >
              🗑️ Wipe Watchlist
            </button>
          </div>
        </div>
      )}

      {/* --- Error Fallback UI --- */}
      {error && !showWatchlistOnly && movies.length === 0 && (
        <div className={`text-center py-20 border rounded-2xl max-w-md mx-auto p-6 ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <p className="text-red-500 font-semibold text-lg mb-4">{error}</p>
          <button onClick={() => fetchMovies(page)} className={`px-5 py-2 font-medium rounded-lg transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
            🔄 Retry Connection
          </button>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <main>
        {/* Empty State / No Results Found */}
        {displayedMovies.length === 0 ? (
          <div className="text-center py-20">
            <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {showWatchlistOnly
                ? (watchlist.length === 0
                  ? "📚 Your Watchlist is currently empty. Go add some movies!"
                  : "📚 Filter subset criteria returned empty matches inside Watchlist storage.")
                : `🔍 No movies found matching criteria.`}
            </p>
          </div>
        ) : (
          <>
            {/* Movies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedMovies.map((movie) => {
                const isSaved = watchlist.some(item => item.id === movie.id);

                return (
                  // Single Movie Card
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovieId(movie.id)}
                    className={`relative rounded-xl overflow-hidden shadow-lg border p-4 flex flex-col justify-between transition cursor-pointer group ${isDark ? 'bg-slate-800 border-slate-700 hover:border-cyan-400' : 'bg-white border-slate-200 hover:border-cyan-600 hover:shadow-xl'
                      }`}
                  >
                    {/* Floating Add to Watchlist Icon Button */}
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

                    {/* Movie Data Wrapper */}
                    <div>
                      {/* Movie Poster Image */}
                      <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-72 object-cover rounded-lg mb-4 group-hover:scale-[1.02] transition duration-300"
                      />
                      <h2 className="text-xl font-bold mb-1 line-clamp-1">{movie.title}</h2>
                      {/* Formatted list of genres mapped from API integer IDs */}
                      <p className={`text-sm mb-2 font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>{getGenreNames(movie.genre_ids)}</p>
                      <p className={`text-xs line-clamp-3 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{movie.overview || "No description available."}</p>
                    </div>

                    {/* Card Footer Details */}
                    <div className={`flex justify-between items-center text-sm font-medium border-t pt-3 mt-2 ${isDark ? 'border-slate-700' : 'border-slate-150'}`}>
                      <span className="text-amber-500">⭐ {movie.vote_average?.toFixed(1) || "N/A"}</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{movie.release_date ? movie.release_date.split('-')[0] : "Unknown"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skeleton Loading State appended below existing results while fetching more */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Hidden Target Div used to trigger Infinite Scrolling */}
            {!showWatchlistOnly && hasMore && <div ref={observerTarget} className="h-10 w-full" />}
          </>
        )}
      </main>

      {/* --- Conditional Modal Render --- */}
      {/* Only mounts when a user has clicked on a movie card */}
      {selectedMovieId && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}

      {/* --- Floating Back to Top Button --- */}
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