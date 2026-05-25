import { LogEntry } from './log-entry.interface.js';

export interface ILogger {
    log(entry: LogEntry): void | Promise<void>;
}
