import { CompositeLogger, ConsoleLogger, FileLogger } from './index.js';
import { config } from '../../config/config.js';

export const logger = new CompositeLogger();

logger.add(new ConsoleLogger());
// In production, we might want to log to a file
if (config.env === 'production') {
    logger.add(new FileLogger('logs/app.log'));
}
