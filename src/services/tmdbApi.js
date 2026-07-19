/**
 * 📡 TMDB API INTEGRATION SERVICE LAYER
 * Documentation Source: https://developer.themoviedb.org/
 */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const tmdbApi = {
  // 1. Required Popular/Trending Endpoint: GET /movie/popular
  getPopular: async () => {
    try {
      const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
      if (!response.ok) throw new Error("Failed to fetch popular movies");
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // 2. Required Search Endpoint: GET /search/movie
  searchMovies: async (query) => {
    try {
      const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
      if (!response.ok) throw new Error("Search query failed");
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // 3. Required Movie Details Endpoint: GET /movie/{movie_id}
  getDetails: async (movieId) => {
    try {
      const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
      if (!response.ok) throw new Error("Failed to fetch movie details");
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};