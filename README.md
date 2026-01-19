# Travel Recommendation Web Application

Lightweight static demo showing a travel recommendation UI with search.

## Overview

This small codebase provides a client-side travel recommendations demo. It loads data from a local JSON file, caches it, and allows the user to search for beaches, temples, countries, or any text across the data. Results are rendered as cards with images, descriptions and an optional local-time badge.

## Files

- travel_recommendation.html — Main demo page (static HTML).
- travel_recommendation.css — Styling for the demo layout.
- travel_recommendation.js — JavaScript logic: data loading, caching, searching, rendering, UI wiring.
- travel_recommendation_api.json — Sample data used by the demo.

## How to run

1. Open `travel_recommendation.html` directly in a browser, or run a simple static server.

   For a quick local server using Python 3:

   ```bash
   python -m http.server 8000
   # then open http://localhost:8000/travelRecommendation/travel_recommendation.html
   ```

2. Use the search input to search keywords like `beach`, `temple`, or `country`. Press Enter or click Search. Use Clear to reset results.

## Key behaviors

- Data is fetched from `travel_recommendation_api.json` once and cached (no repeated fetch).
- Search supports keyword shortcuts: `beach`, `temple`, `country`, and a fallback full-text search across name/description/country/category.
- Results render as cards with image, title, description, category/country meta and a Visit button.
- Optional features in `travel_recommendation.js` include a timezone map to show local times for destinations.

## Development notes

- To add or replace images, update the `imageUrl` fields in `travel_recommendation_api.json`.
- To extend timezone mappings, edit the `TIMEZONE_MAP` object in `travel_recommendation.js`.

## License

See the repository `LICENSE` file for licensing information.
