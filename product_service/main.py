from fastapi import FastAPI, Query
from elasticsearch import Elasticsearch
import asyncio

app = FastAPI()

# Connect to the local ElasticSearch database
es = Elasticsearch("http://elasticsearch:9200")
INDEX_NAME = "products"

def init_data():
    """Initialize the Elasticsearch index with sample data"""
    import time
    from elasticsearch import exceptions
    
    catalog_data = [
        {
            "id": 1,
            "name": "Sony Wireless Headphones",
            "description": "Noise cancelling over-ear headphones",
            "price": 299.99,
            "category": "Electronics",
        },
        {
            "id": 2,
            "name": "Mechanical Gaming Keyboard",
            "description": "RGB backlit mechanical keyboard with blue switches",
            "price": 149.50,
            "category": "Electronics",
        },
        {
            "id": 3,
            "name": "Running Shoes",
            "description": "Lightweight marathon running shoes",
            "price": 120.00,
            "category": "Apparel",
        },
        {
            "id": 4,
            "name": "Coffee Maker",
            "description": "Programmable drip coffee maker",
            "price": 89.99,
            "category": "Home",
        },
        {
            "id": 5,
            "name": "Bluetooth Speaker",
            "description": "Waterproof portable bluetooth speaker",
            "price": 59.99,
            "category": "Electronics",
        },
    ]
    
    # Retry up to 30 times with 1 second delay (30 seconds total)
    max_retries = 30
    for attempt in range(max_retries):
        try:
            # Check if Elasticsearch is alive
            es.info()
            break
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            else:
                print(f"Failed to connect to Elasticsearch after {max_retries} attempts")
                return
    
    try:
        es.indices.delete(index=INDEX_NAME)
        print(f"Deleted old '{INDEX_NAME}' index.")
    except exceptions.NotFoundError:
        pass
    except Exception as e:
        print(f"Error deleting index: {e}")
    
    try:
        es.indices.create(index=INDEX_NAME)
        print(f"Created new '{INDEX_NAME}' index.")
    except exceptions.BadRequestError:
        pass
    except Exception as e:
        print(f"Error creating index: {e}")
    
    for item in catalog_data:
        try:
            es.index(index=INDEX_NAME, id=item["id"], document=item)
            print(f"Ingested: {item['name']}")
        except Exception as e:
            print(f"Error indexing {item['name']}: {e}")

@app.on_event("startup")
async def startup_event():
    """Initialize the Elasticsearch index with sample data on startup"""
    try:
        # Run the synchronous init in the default executor
        await asyncio.get_event_loop().run_in_executor(None, init_data)
        print("✅ Data initialization complete!")
    except Exception as e:
        print(f"Startup initialization failed: {e}")
        # Don't fail the startup, just log the error

@app.get("/products")
async def get_all_products():
    """Get all products"""
    try:
        search_query = {"query": {"match_all": {}}}
        response = es.search(index=INDEX_NAME, body=search_query)
        results = [hit["_source"] for hit in response["hits"]["hits"]]
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e), "results": []}

@app.get("/search")
async def search_products(q: str = Query(..., description="Search keyword")):
    """
    Takes a search keyword from the user and asks ElasticSearch for matches.
    """
    try:
        # This is the standard ElasticSearch JSON query syntax
        search_query = {
            "query": {
                "match": {
                    # We are telling it to search inside the 'name' field
                    "name": q
                }
            }
        }
        
        # Execute the search
        response = es.search(index=INDEX_NAME, body=search_query)
        
        # ElasticSearch returns a lot of metadata. We just want the actual product data.
        results = [hit["_source"] for hit in response["hits"]["hits"]]
        
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e), "results": []}