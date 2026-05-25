import { ILogger } from '../logger.interface.js';
import { LogEntry } from '../log-entry.interface.js';

export class CompositeLogger implements ILogger {
    private loggers: ILogger[] = [];

    add(logger: ILogger): void {
        this.loggers.push(logger);
    }

    remove(logger: ILogger): void {
        this.loggers = this.loggers.filter(l => l !== logger);
    }

    async log(entry: LogEntry): Promise<void> {
        await Promise.all(this.loggers.map(logger => logger.log(entry)));
    }
}
