import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ILogger } from '../logger.interface.js';
import { LogEntry } from '../log-entry.interface.js';

export class FileLogger implements ILogger {
    constructor(private filePath: string) {}

    async log(entry: LogEntry): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });
        await appendFile(this.filePath, JSON.stringify(entry) + '\n');
    }
}

