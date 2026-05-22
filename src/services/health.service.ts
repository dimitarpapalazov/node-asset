export interface HealthStatus {
    status: string;
    timestamp: string;
}

export const getHealthStatus = (): HealthStatus => {
    return {
        status: 'UP',
        timestamp: new Date().toISOString(),
    };
};
