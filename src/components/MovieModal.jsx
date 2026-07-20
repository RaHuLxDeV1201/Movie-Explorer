/**
  MOVIE DETAIL MODAL COMPONENT
  ================================
  
  This component displays detailed information about a selected movie
  in a beautiful modal popup with all the metadata from TMDB API.
  
  FEATURES:
   Shows complete movie details (runtime, genres, languages, etc.)
   Close by clicking outside modal (on the backdrop)
   Close by pressing ESC key (accessibility feature)
  Beautiful dark modal design
  Responsive layout (side-by-side on desktop, stacked on mobile)
  Loading state while fetching movie details
  Error handling if details fail to load
  Smooth animations and transitions
 */

import { useEffect, useState } from "react";
import { tmdbApi } from "../services/tmdbApi";

/**
  MovieModal Component
  
  @param {number} movieId - The ID of the movie to fetch details for
  @param {function} onClose - Callback function to close the modal
 
 WHY SEPARATE COMPONENT?: 
 This keeps App.jsx cleaner and makes the modal reusable if needed elsewhere
 */
export default function MovieModal({ movieId, onClose }) {
  // ========================================
  // STATE
  // ========================================

  // Movie details object - null until fetched
  const [movie, setMovie] = useState(null);

  // Show loading state while fetching from API
  const [loading, setLoading] = useState(true);

  // ========================================
  // KEYBOARD NAVIGATION - ESC to close
  // ========================================
  /**
   ACCESSIBILITY FEATURE:
   When user presses ESC key, close the modal
    This is a standard UX pattern that users expect
   
   Why useEffect?: To add/remove the event listener only when component mounts/unmounts
   This prevents memory leaks and multiple listeners being added
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose(); // ESC key pressed = close modal
    };

    // Add listener when component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove listener when component unmounts
    // This prevents the listener from persisting after modal closes
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]); // Re-run if onClose function changes

  // ========================================
  // FETCH MOVIE DETAILS
  // ========================================
  /**
    When movieId prop changes, fetch the detailed information from TMDB API
   This includes: runtime, genres, languages, popularity, vote count, etc.
   
   API ENDPOINT USED: GET /movie/{movie_id}
   This is one of the 3 required endpoints in the project requirements
   */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true); // Start loading

        // Call the TMDB API service to get detailed movie info
        // (See services/tmdbApi.js for implementation)
        const data = await tmdbApi.getDetails(movieId);
        setMovie(data); // Store the details

      } catch (err) {
        // If API call fails, log the error (don't crash the app)
        console.error("Error loading movie details:", err);
        // Optional: Could set an error state here to show to user
      } finally {
        setLoading(false); // Stop loading regardless of success/error
      }
    };

    // Only fetch if we have a movieId
    if (movieId) fetchDetails();

  }, [movieId]); // Re-run when movieId changes

  // ========================================
  // RENDER LOGIC
  // ========================================

  // Don't render anything if no movieId (safety check)
  if (!movieId) return null;

  return (
    /**
      MODAL BACKDROP
      Click anywhere on the dark background to close modal
     This is a common pattern users expect
     */
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      {/* 
        MODAL CONTENT CONTAINER
        Click on the modal content itself should NOT close it (e.stopPropagation)
        This way user can safely interact with the content
      */}
      <div
        onClick={(e) => e.stopPropagation()} // Don't close if clicking inside modal
        className="relative w-full max-w-3xl bg-slate-800 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col md:flex-row"
      >
        {/* ========== CLOSE BUTTON ========== */}
        {/* Top-right corner close button (X icon) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-900 transition p-2 rounded-full text-slate-300 font-bold"
          title="Close modal (or press ESC)"
        >
          ✕
        </button>

        {/* ========== LOADING STATE ========== */}
        {loading ? (
          <div className="p-12 w-full text-center text-cyan-400 animate-pulse font-semibold">
            Loading movie details...
          </div>
        )

          /* ========== SUCCESS STATE ========== */
          : movie ? (
            <>
              {/* LEFT SIDE: POSTER IMAGE */}
              <div className="w-full md:w-2/5 h-64 md:h-auto">
                <img
                  src={movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://via.placeholder.com/500x750?text=No+Image'
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* RIGHT SIDE: MOVIE DETAILS */}
              <div className="w-full md:w-3/5 p-6 flex flex-col justify-between">

                {/* MOVIE TITLE AND OVERVIEW SECTION */}
                <div>
                  {/* TITLE - Large, cyan colored */}
                  <h2 className="text-2xl font-extrabold text-cyan-400 mb-2">
                    {movie.title}
                  </h2>

                  {/* TAGLINE - Smaller italic text (if available) */}
                  <p className="text-sm italic text-slate-400 mb-4">
                    {movie.tagline || "No tagline available"}
                  </p>

                  {/* OVERVIEW LABEL */}
                  <h3 className="font-semibold text-slate-300 mb-1">Overview</h3>

                  {/* FULL MOVIE DESCRIPTION */}
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                    {movie.overview || "No description available."}
                  </p>
                </div>

                {/* DETAILED METADATA GRID */}
                {/* 2-column grid showing all the movie metadata */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 text-xs">

                  {/* RUNTIME */}
                  <div>
                    <span className="text-slate-400 block">Runtime</span>
                    <span className="font-medium text-slate-200">
                      {movie.runtime ? `${movie.runtime} minutes` : "N/A"}
                    </span>
                  </div>

                  {/* ORIGINAL LANGUAGE */}
                  <div>
                    <span className="text-slate-400 block">Language</span>
                    <span className="font-medium uppercase text-slate-200">
                      {movie.original_language || "N/A"}
                    </span>
                  </div>

                  {/* GENRES - Takes full width */}
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Genres</span>
                    <span className="font-medium text-cyan-300">
                      {movie.genres && movie.genres.length > 0
                        ? movie.genres.map(g => g.name).join(", ")
                        : "N/A"
                      }
                    </span>
                  </div>

                  {/* SPOKEN LANGUAGES */}
                  <div>
                    <span className="text-slate-400 block">Spoken Languages</span>
                    <span className="font-medium text-slate-200">
                      {movie.spoken_languages && movie.spoken_languages.length > 0
                        ? movie.spoken_languages.map(l => l.english_name).join(", ")
                        : "N/A"
                      }
                    </span>
                  </div>

                  {/* POPULARITY SCORE */}
                  <div>
                    <span className="text-slate-400 block">Popularity Score</span>
                    <span className="font-medium text-slate-200">
                      {movie.popularity?.toFixed(0) || "N/A"}
                    </span>
                  </div>

                  {/* TOTAL VOTES - Takes full width */}
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Total Vote Count</span>
                    <span className="font-medium text-slate-200">
                      {movie.vote_count?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )

            /* ========== ERROR STATE ========== */
            : (
              <div className="p-12 w-full text-center text-red-500 font-semibold">
                Failed to load movie details.
              </div>
            )}
      </div>
    </div>
  );
}
