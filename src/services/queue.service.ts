import amqp, { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { config } from '../config/config.js';

/**
 * Service for interacting with RabbitMQ.
 * Handles connection, publishing, and subscribing to queues.
 */
export class QueueService {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;

    /**
     * Connects to RabbitMQ and creates a channel.
     */
    async connect(): Promise<void> {
        if (this.connection) return;

        try {
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            this.connection.on('error', (err: Error) => {
                console.error('RabbitMQ connection error', err);
                this.connection = null;
                this.channel = null;
            });

            this.connection.on('close', () => {
                console.warn('RabbitMQ connection closed');
                this.connection = null;
                this.channel = null;
            });

            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            throw error;
        }
    }

    /**
     * Publishes a message to a specific queue.
     * 
     * @param queue - The name of the queue.
     * @param message - The message payload (will be JSON stringified).
     */
    async publish(queue: string, message: any): Promise<void> {
        if (!this.channel) {
            await this.connect();
        }

        await this.channel!.assertQueue(queue, { durable: true });
        this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
    }

    /**
     * Subscribes to a queue and executes a handler for each message.
     * 
     * @param queue - The name of the queue.
     * @param handler - A function to handle the parsed message payload.
     */
    async subscribe(queue: string, handler: (message: any) => Promise<void> | void): Promise<void> {
        if (!this.channel) {
            await this.connect();
        }

        await this.channel!.assertQueue(queue, { durable: true });
        
        await this.channel!.consume(queue, async (msg: ConsumeMessage | null) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    this.channel!.ack(msg);
                } catch (error) {
                    console.error('Error handling RabbitMQ message', error);
                    // Optionally nack with requeue: false to avoid infinite loops on bad messages
                    this.channel!.nack(msg, false, false);
                }
            }
        });
    }

    /**
     * Closes the channel and connection.
     */
    async disconnect(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.channel = null;
            this.connection = null;
            console.log('Disconnected from RabbitMQ');
        } catch (error) {
            console.error('Error disconnecting from RabbitMQ', error);
        }
    }
}

export const queueService = new QueueService();
