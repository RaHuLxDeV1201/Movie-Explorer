# 🎬 Movie Explorer Dashboard

A highly responsive frontend application built with React, Vite, and Tailwind CSS v4 to discover movies using The Movie Database (TMDB) API.

##  Data & API Usage
This project relies exclusively on the official TMDB API platform to fetch real-time movie feed assets, queries, and deep metrics metadata.

* **Official API Documentation**: [TMDB Docs](https://developer.themoviedb.org/)

###  Implemented Endpoints Matrix
The application connects directly to the following required data collection points:
1. **Popular/Trending Feed**: `GET /movie/popular` — Fetches the seed list of trending titles on app load.
2. **Search Directory**: `GET /search/movie` — Queries specific movie elements based on the live text string input.
3. **Movie In-Depth Details**: `GET /movie/{movie_id}` — Resolves advanced metrics like running runtime and native localized translation strings for the detailed card modal.

###  Graphic Content Delivery Format
All layout post elements utilize the standard structural rendering format:
* Base Image Link Syntax: `https://image.tmdb.org/t/p/w500/<poster_path>`

###  Field Extraction Schemas
- **Listing Data Bundles**: `id`, `title`, `release_date`, `vote_average`, `genre_ids` (mapped to readable terms), `overview`, and `poster_path`.
- **Deep Metadata Modules**: `runtime`, `spoken_languages`, `genres`, `popularity`, and `vote_count`.

##  Development Challenges I Faced & Overcame
1. **Search Debouncing Issues:** Initially, my application was hammering the TMDB API every time a key was pressed. I fixed this by setting up a custom `setTimeout` inside a cleanup `useEffect` block to wait 500ms before sending a network request.
2. **Infinite Scroll vs Filters:** Synchronizing the pagination page counts when changing genre tags was tricky because old lists kept sticking around. I solved this by triggering a manual state clear hook array `setMovies([])` right when active categories shift.
