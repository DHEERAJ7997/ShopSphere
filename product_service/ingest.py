from elasticsearch import Elasticsearch, exceptions

# Connect to the ElasticSearch container (use Docker service name inside containers)
es = Elasticsearch("http://elasticsearch:9200")
INDEX_NAME = "products"

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
        "name": "Coffee Maker Machine",
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

     
def ingest_data():
    # 1. Try to delete the index using a standard DELETE request
    try:
        es.indices.delete(index=INDEX_NAME)
        print(f"Deleted old '{INDEX_NAME}' index.")
    except exceptions.NotFoundError:
        # If it doesn't exist yet, ElasticSearch throws a NotFoundError. That is fine!
        pass

    # 2. Try to create the new index using a standard PUT request
    try:
        es.indices.create(index=INDEX_NAME)
        print(f"Created new '{INDEX_NAME}' index.")
    except exceptions.BadRequestError:
        # If it somehow already exists, it throws a BadRequestError.
        print(f"Index '{INDEX_NAME}' already exists. Proceeding.")

    # 3. Loop through our catalog and push each item into ElasticSearch
    for item in catalog_data:
        es.index(index=INDEX_NAME, id=item["id"], document=item)
        print(f"Ingested: {item['name']}")


if __name__ == "__main__":
    ingest_data()
    print("Data ingestion complete!")
