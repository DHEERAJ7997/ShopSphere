# ShopSphere frontend (shopsphere-vanilla)

Simple static demo frontend. Files:

- `index.html` — main page
- `styles.css` — basic styles
- `script.js` — small client that fetches `/products` from API

Run locally (recommended) from `shopsphere-vanilla` folder:

```powershell
python -m http.server 5500
```

Then open: http://127.0.0.1:5500

Notes:
- The JS uses `http://127.0.0.1:8000` as `API_BASE`. Update `script.js` if your gateway runs on another port.
- Ensure your backend (API gateway / services) are running and allow CORS for the frontend origin.
- To run full stack with Docker: `docker-compose up --build` from repository root (if you prefer containers).
