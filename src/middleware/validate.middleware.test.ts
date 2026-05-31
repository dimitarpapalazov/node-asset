import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validate.middleware.js';

describe('validate middleware', () => {
    const schema = z.object({
        body: z.object({
            name: z.string(),
        }),
    });

    it('should call next() if validation passes', async () => {
        const middleware = validate(schema);
        const req = { body: { name: 'Test' } } as Request;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ name: 'Test' });
    });

    it('should call next(error) if validation fails', async () => {
        const middleware = validate(schema);
        const req = { body: {} } as Request;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle nested paths and strip unknown fields', async () => {
        const middleware = validate(schema);
        const req = { body: { name: 'Test', unknown: 'field' } } as any;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ name: 'Test' });
        expect(req.body.unknown).toBeUndefined();
    });
});
