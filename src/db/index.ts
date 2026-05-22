import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config/config.js';

const db = drizzle(config.db.url);
