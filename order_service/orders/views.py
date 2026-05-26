import json
import redis
import pika
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Connect to Redis
try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True, socket_connect_timeout=5)
    redis_client.ping()
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    redis_client = None

@csrf_exempt
def manage_cart(request):
    """Manage shopping cart items"""
    try:
        if not redis_client:
            return JsonResponse({"error": "Redis service unavailable"}, status=503)
        
        user_id = "user_123"
        cart_key = f"cart:{user_id}"
        
        if request.method == 'POST':
            data = json.loads(request.body)
            product_id = str(data.get('product_id'))
            quantity = int(data.get('quantity', 1))
            
            if not product_id:
                return JsonResponse({"error": "Missing product_id"}, status=400)
            
            redis_client.hset(cart_key, product_id, quantity)
            return JsonResponse({
                "status": "success",
                "message": "Item added to cart",
                "product_id": product_id,
                "quantity": quantity
            })

        elif request.method == 'GET':
            cart_items = redis_client.hgetall(cart_key)
            return JsonResponse({
                "status": "success",
                "cart": cart_items,
                "item_count": len(cart_items)
            })
        
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def checkout(request):
    """Process checkout and publish order event"""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        if not redis_client:
            return JsonResponse({"error": "Redis service unavailable"}, status=503)
        
        user_id = "user_123"
        cart_key = f"cart:{user_id}"
        
        # 1. Get items from Redis
        cart_items = redis_client.hgetall(cart_key)
        
        if not cart_items:
            return JsonResponse({"error": "Cart is empty"}, status=400)

        # 2. Simulate saving order
        order_id = str(uuid.uuid4())
        
        try:
            # 3. Connect to RabbitMQ
            connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq', heartbeat=0))
            channel = connection.channel()
            channel.queue_declare(queue='order_events')

            # 4. Create and publish message
            event_data = {
                "event": "ORDER_PLACED",
                "order_id": order_id,
                "user_id": user_id,
                "items": cart_items
            }

            channel.basic_publish(
                exchange='',
                routing_key='order_events',
                body=json.dumps(event_data)
            )
            connection.close()
            print(f"✅ Order {order_id} published to RabbitMQ")
        except Exception as e:
            print(f"⚠️ RabbitMQ error: {e}")
            # Don't fail checkout if RabbitMQ is down - just log it

        # 5. Clear Cart
        redis_client.delete(cart_key)

        return JsonResponse({
            "status": "success",
            "message": "Checkout successful!",
            "order_id": order_id
        })
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)