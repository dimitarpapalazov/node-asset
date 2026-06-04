import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config/config.js', () => ({
    config: {
        rabbitmq: {
            url: 'amqp://localhost'
        }
    }
}));

import amqp from 'amqplib';
import { QueueService } from './queue.service.js';
import { config } from '../config/config.js';

vi.mock('amqplib');

describe('QueueService', () => {
    let queueService: QueueService;
    const mockChannel = {
        assertQueue: vi.fn().mockResolvedValue({}),
        sendToQueue: vi.fn().mockReturnValue(true),
        consume: vi.fn().mockResolvedValue({ consumerTag: 'test-tag' }),
        close: vi.fn().mockResolvedValue(undefined),
        ack: vi.fn(),
    };
    const mockConnection = {
        createChannel: vi.fn().mockResolvedValue(mockChannel),
        close: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (amqp.connect as any).mockResolvedValue(mockConnection);
        queueService = new QueueService();
    });

    afterEach(async () => {
        // Cleanup if needed
    });

    it('should connect to RabbitMQ using config URL', async () => {
        await queueService.connect();
        expect(amqp.connect).toHaveBeenCalledWith(config.rabbitmq.url);
        expect(mockConnection.createChannel).toHaveBeenCalled();
    });

    it('should publish a message to a queue', async () => {
        await queueService.connect();
        const queueName = 'test-queue';
        const message = { foo: 'bar' };
        
        await queueService.publish(queueName, message);
        
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(queueName, { durable: true });
        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
            queueName,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );
    });

    it('should subscribe to a queue and handle messages', async () => {
        await queueService.connect();
        const queueName = 'test-queue';
        const handler = vi.fn();
        const mockMsg = {
            content: Buffer.from(JSON.stringify({ hello: 'world' })),
        };

        mockChannel.consume.mockImplementation(async (q, callback) => {
            callback(mockMsg);
            return { consumerTag: 'abc' };
        });

        await queueService.subscribe(queueName, handler);

        expect(mockChannel.assertQueue).toHaveBeenCalledWith(queueName, { durable: true });
        expect(mockChannel.consume).toHaveBeenCalledWith(queueName, expect.any(Function));
        expect(handler).toHaveBeenCalledWith({ hello: 'world' });
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should close connection and channel on disconnect', async () => {
        await queueService.connect();
        await queueService.disconnect();
        
        expect(mockChannel.close).toHaveBeenCalled();
        expect(mockConnection.close).toHaveBeenCalled();
    });
});
