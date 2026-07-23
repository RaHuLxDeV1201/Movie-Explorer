# 🎬 Movie Explorer Dashboard

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A high-performance, responsive frontend application built to explore movies using **The Movie Database (TMDB) API**. Built with modern React, Vite, and Tailwind CSS v4, this dashboard offers real-time trending feeds, debounced instant search, genre filtering, and deep cinematic metadata metrics.

---

## 📑 Table of Contents

- [Overview & Key Features](#-overview--key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [API Integration & Specifications](#-api-integration--specifications)
  - [Implemented Endpoints Matrix](#implemented-endpoints-matrix)
  - [Graphic Content Delivery](#graphic-content-delivery)
  - [Field Extraction Schemas](#field-extraction-schemas)
- [Engineering Challenges & Insights](#-engineering-challenges--insights)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [License](#-license)

---

## ✨ Overview & Key Features

* **Trending & Popular Feed:** Dynamic discovery of top titles upon application launch.
* **Debounced Search Directory:** Asynchronous text query execution with optimized request throttling.
* **Detailed Metric Modals:** Deep dive into movie runtimes, native localized translations, audience rating metrics, and language metadata.
* **Smart Category Filtering:** Clean state management when switching between genre tags and infinite scroll pages.
* **Ultra-Responsive UI:** Modern layout constructed with Tailwind CSS v4 design primitives.

---

## 🛠️ Tech Stack

* **Core Framework:** [React 18+](https://react.dev/)
* **Build System & HMR:** [Vite](https://vitejs.dev/)
* **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Data Provider:** [TMDB REST API v3](https://developer.themoviedb.org/)
* **HTTP Client:** Native `Fetch API` / `Axios`

---

## 📁 Project Architecture

```text
movie-explorer-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/          # Static images & icons
│   ├── components/      # Modular UI components (Cards, Modals, Navbar, Filters)
│   ├── hooks/           # Custom React hooks (useDebounce, useMovies)
│   ├── services/        # TMDB API client configuration & endpoints
│   ├── styles/          # Tailwind setup & custom CSS variables
│   ├── utils/           # Helper utilities (formatters, genre mappers)
│   ├── App.jsx          # Root application layout
│   └── main.jsx         # Application entry point
├── .env.example         # Environment variable template
├── package.json
└── vite.config.js
