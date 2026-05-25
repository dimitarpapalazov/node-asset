export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL'
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    userId?: string;
    ipAddress?: string;
    environment: string;
    traceId: string;
    [key: string]: any;
}
