import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        env: {
            PORT: '3000',
            DB_HOST: 'localhost',
            DB_PORT: '5432',
            DB_USER: 'test_user',
            DB_PASSWORD: 'test_password',
            DB_NAME: 'test_db',
            JWT_ACCESS_SECRET: 'test_access_secret',
            JWT_REFRESH_SECRET: 'test_refresh_secret',
            ACCESS_TOKEN_EXPIRY: '15m',
            REFRESH_TOKEN_EXPIRY: '7d',
            UPLOADS_DIR: 'test-uploads',
            NODE_ENV: 'test',
            RATE_LIMIT_WINDOW_MS: '900000',
            RATE_LIMIT_MAX_REQUESTS: '100',
            LOG_FILE_PATH: 'logs/test.log',
        },
    },
});
