# 🎬 Movie Explorer Dashboard

[cite_start]A highly responsive frontend application built with React, Vite, and Tailwind CSS v4 to discover movies using The Movie Database (TMDB) API[cite: 8].

## 📡 Data & API Usage
[cite_start]This project relies exclusively on the official TMDB API platform to fetch real-time movie feed assets, queries, and deep metrics metadata[cite: 67].

* [cite_start]**Official API Documentation**: [TMDB Docs](https://developer.themoviedb.org/) [cite: 74]

### 🔌 Implemented Endpoints Matrix
[cite_start]The application connects directly to the following required data collection points[cite: 75]:
1. [cite_start]**Popular/Trending Feed**: `GET /movie/popular` — Fetches the seed list of trending titles on app load[cite: 76, 77].
2. [cite_start]**Search Directory**: `GET /search/movie` — Queries specific movie elements based on the live text string input[cite: 78].
3. [cite_start]**Movie In-Depth Details**: `GET /movie/{movie_id}` — Resolves advanced metrics like running runtime and native localized translation strings for the detailed card modal[cite: 79].

### 🖼️ Graphic Content Delivery Format
[cite_start]All layout post elements utilize the standard structural rendering format[cite: 80]:
* [cite_start]Base Image Link Syntax: `https://image.tmdb.org/t/p/w500/<poster_path>` [cite: 82]

### 📊 Field Extraction Schemas
- [cite_start]**Listing Data Bundles**: `id`, `title`, `release_date`, `vote_average`, `genre_ids` (mapped to readable terms), `overview`, and `poster_path`[cite: 85, 86, 87, 88, 89, 90].
- [cite_start]**Deep Metadata Modules**: `runtime`, `spoken_languages`, `genres`, `popularity`, and `vote_count`[cite: 103].
## 🧠 Development Challenges I Faced & Overcame
1. **Search Debouncing Issues:** Initially, my application was hammering the TMDB API every time a key was pressed. I fixed this by setting up a custom `setTimeout` inside a cleanup `useEffect` block to wait 500ms before sending a network request.
2. **Infinite Scroll vs Filters:** Synchronizing the pagination page counts when changing genre tags was tricky because old lists kept sticking around. I solved this by triggering a manual state clear hook array `setMovies([])` right when active categories shift.