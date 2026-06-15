
import pika
import time
import json

def callback(ch, method, properties, body):
    order_data = json.loads(body)
    order_id = order_data.get("order_id")
    items = order_data.get("items", {})
    print(f" [x] Received order to process: {order_data}")
    for product_id, quantity in items.items():
        time.sleep(1)
        print(f" [x] Deducted {quantity} of product {product_id} for order {order_id}")
    print(f" [x] Order {order_id} processed successfully!")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_listening():
    print(" [*] Inventory worker booting up...")
    # Give RabbitMQ a few seconds to finish booting before connecting
    time.sleep(10) 
    
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq', heartbeat=0))
    channel = connection.channel()
    channel.queue_declare(queue='order_events', durable=True)

    print(' [*] Waiting for order events. To exit press CTRL+C')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='order_events', on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    start_listening()
