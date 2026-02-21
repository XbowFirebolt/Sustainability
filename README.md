# Sustainability Tracker

A web app for browsing and following sustainability projects — from reforestation and ocean cleanup to urban solar and rewilding. Each project themes the entire UI with its own color, and you can favorite projects to keep them in your personal dock.

## Features

- **Project dock** — Infinite carousel of your favorited projects on the home screen
- **Dynamic theming** — The UI colors shift to match whichever project is active
- **Discover page** — Browse and search all projects, star favorites
- **Account modal** — View your account info and favorited projects
- **Persistent state** — Favorites and account data saved to localStorage

## Running Locally

```
npm start
```

Then open the URL printed in the terminal (default: http://localhost:3000).

No install step required — `npx serve` is used automatically.

## Project Structure

```
/
├── index.html          # Home page
├── discover.html       # Project discovery page
├── js/
│   ├── shared.js       # Project catalog, theming, account, and dock logic
│   ├── discover.js     # Discover page search and favorites logic
│   └── theme-init.js   # Early theme initialization (runs before page renders)
├── css/
│   └── styles.css      # Global stylesheet
└── assets/
    └── map.png         # World map background image
```
