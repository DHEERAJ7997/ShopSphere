# ShopSphere frontend

Marketplace-style UI connected to the API gateway.

## Run with full stack (Docker)

From the project root:

```powershell
docker compose -f Docker-compose.yml up --build
```

Open http://127.0.0.1:5500

## Run frontend only

```powershell
cd shopsphere-vanilla
python -m http.server 5500
```

The API gateway must be running on http://127.0.0.1:8000.

## Features

- Product catalog from `/api/products`
- Search via `/api/search`
- Cart sync via `/api/cart`
- Checkout via `/api/checkout`

Update `API_BASE` in `script.js` if your gateway uses a different host or port.
