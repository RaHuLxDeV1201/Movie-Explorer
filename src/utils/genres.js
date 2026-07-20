// A quick lookup table for movie genres based on their API IDs (these look like TMDB standard IDs).
// Hardcoding this saves us from having to make a separate API call just to fetch the genre list.
export const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western"
};

// Helper function to turn an array of raw IDs (like [28, 12]) into a readable string (like "Action, Adventure")
export const getGenreNames = (genreIds) => {
  // Safety check first! Just in case the API gives us null, undefined, or weird data instead of an array.
  if (!genreIds || !Array.isArray(genreIds)) return "Unknown";
  
  // Go through each ID and grab the matching name from our map above.
  // If we come across a weird ID that isn't in our map, just call it "Other".
  // Finally, join them all together with a comma and space for the UI.
  return genreIds.map(id => GENRE_MAP[id] || "Other").join(", ");
};