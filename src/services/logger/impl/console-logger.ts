import { ILogger } from '../logger.interface.js';
import { LogEntry } from '../log-entry.interface.js';

export class ConsoleLogger implements ILogger {
    log(entry: LogEntry): void {
        console.log(JSON.stringify(entry));
    }
}
