
import pika
import time
import json

def callback(ch, method, properties, body):
    order_data = json.loads(body)
    print(f" [x] Received order to process: {order_data}")
    # Here is where you would deduct inventory from a database!
    time.sleep(2) # Simulating hard work
    print(f" [x] Order {order_data.get('product_id')} processed successfully!")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_listening():
    print(" [*] Inventory worker booting up...")
    # Give RabbitMQ a few seconds to finish booting before connecting
    time.sleep(10) 
    
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq', heartbeat=0))
    channel = connection.channel()
    channel.queue_declare(queue='checkout_queue', durable=True)
    
    print(' [*] Waiting for checkout events. To exit press CTRL+C')
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='checkout_queue', on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    start_listening()
