import { useEffect, useState } from "react";
import { tmdbApi } from "../services/tmdbApi";

export default function MovieModal({ movieId, onClose }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await tmdbApi.getDetails(movieId);
        setMovie(data);
      } catch (err) {
        console.error("Error loading movie details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (movieId) fetchDetails();
  }, [movieId]);

  if (!movieId) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      {/* e.stopPropagation() prevents closing when clicking inside the modal content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-800 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col md:flex-row"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-900 transition p-2 rounded-full text-slate-300 font-bold"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-12 w-full text-center text-cyan-400 animate-pulse font-semibold">
            Loading movie details...
          </div>
        ) : movie ? (
          <>
            <div className="w-full md:w-2/5 h-64 md:h-auto">
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full md:w-3/5 p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-cyan-400 mb-2">{movie.title}</h2>
                <p className="text-sm italic text-slate-400 mb-4">{movie.tagline || "No tagline available"}</p>
                <h3 className="font-semibold text-slate-300 mb-1">Overview</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{movie.overview || "No description available."}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Runtime</span>
                  <span className="font-medium text-slate-200">{movie.runtime ? `${movie.runtime} minutes` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Language</span>
                  <span className="font-medium uppercase text-slate-200">{movie.original_language || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Genres</span>
                  <span className="font-medium text-cyan-300">
                    {movie.genres && movie.genres.length > 0 ? movie.genres.map(g => g.name).join(", ") : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Spoken Languages</span>
                  <span className="font-medium text-slate-200">
                    {movie.spoken_languages && movie.spoken_languages.length > 0 ? movie.spoken_languages.map(l => l.english_name).join(", ") : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Popularity Score</span>
                  <span className="font-medium text-slate-200">{movie.popularity?.toFixed(0) || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Total Vote Count</span>
                  <span className="font-medium text-slate-200">{movie.vote_count?.toLocaleString() || "N/A"}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 w-full text-center text-red-500 font-semibold">
            Failed to load movie details.
          </div>
        )}
      </div>
    </div>
  );
}
