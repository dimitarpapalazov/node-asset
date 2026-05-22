import { defineConfig } from 'drizzle-kit';
import { config } from "./src/config/config.ts";

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: config.db.url
    },
});
