from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = "http://auth-service:5001"
PRODUCT_SERVICE_URL = "http://product-service:5002"
ORDER_SERVICE_URL = "http://order-service:5003"


@app.post("/api/auth/login")
async def route_auth_login(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        flask_response = await client.post(f"{AUTH_SERVICE_URL}/login", json=body)
    return flask_response.json()


@app.get("/api/products")
async def route_get_products():
    async with httpx.AsyncClient() as client:
        fastapi_response = await client.get(f"{PRODUCT_SERVICE_URL}/products")
    return fastapi_response.json()


@app.post("/api/cart")
async def route_add_to_cart(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        django_response = await client.post(f"{ORDER_SERVICE_URL}/api/cart/", json=body)
    return django_response.json()


@app.get("/api/cart")
async def route_get_cart():
    async with httpx.AsyncClient() as client:
        django_response = await client.get(f"{ORDER_SERVICE_URL}/api/cart/")
    return django_response.json()


@app.get("/api/search")
async def route_search_products(q: str):
    async with httpx.AsyncClient() as client:
        fastapi_response = await client.get(f"{PRODUCT_SERVICE_URL}/search?q={q}")
    return fastapi_response.json()


@app.post("/api/checkout")
async def route_checkout(request: Request):
    async with httpx.AsyncClient() as client:
        django_response = await client.post(f"{ORDER_SERVICE_URL}/api/checkout/")
    return django_response.json()
