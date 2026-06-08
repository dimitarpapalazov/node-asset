import { queueService } from './queue.service.js';
import * as projectService from './project.service.js';
import { storageService } from './storage.service.js';
import { db } from '../db/index.js';
import { exportJobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ExportStatus, QueueName } from '../constants/constants.js';
import { logger } from './logger/logger.factory.js';
import { LogLevel } from './logger/index.js';
import { config } from '../config/config.js';

interface ExportTask {
    jobId: string;
    projectId: string;
    userId: string;
}

/**
 * Worker for processing project export tasks.
 */
export const startExportWorker = async (): Promise<void> => {
    await queueService.subscribe(QueueName.PROJECT_EXPORTS, async (task: ExportTask) => {
        const { jobId, projectId, userId } = task;

        logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Worker started processing export job: ${jobId}`,
            environment: config.env,
            traceId: 'worker',
        });

        try {
            // 1. Update status to processing
            await db.update(exportJobs)
                .set({ status: ExportStatus.PROCESSING, updatedAt: new Date() })
                .where(eq(exportJobs.id, jobId));

            // 2. Perform export (this returns an Archiver stream)
            const { archive } = await projectService.exportProject(projectId, userId);

            // 3. Save stream to CAS storage
            const zipHash = await storageService.saveStream(archive);

            // 4. Update job record with zipHash and status completed
            await db.update(exportJobs)
                .set({ 
                    status: ExportStatus.COMPLETED, 
                    zipHash, 
                    updatedAt: new Date() 
                })
                .where(eq(exportJobs.id, jobId));

            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.INFO,
                message: `Export job completed successfully: ${jobId}. Resulting hash: ${zipHash}`,
                environment: config.env,
                traceId: 'worker',
            });
        } catch (error: any) {
            console.error(`Error processing export job ${jobId}:`, error);

            // Update status to failed
            await db.update(exportJobs)
                .set({ 
                    status: ExportStatus.FAILED, 
                    error: error.message || 'Unknown error during export',
                    updatedAt: new Date() 
                })
                .where(eq(exportJobs.id, jobId));

            logger.log({
                timestamp: new Date().toISOString(),
                level: LogLevel.ERROR,
                message: `Export job failed: ${jobId}. Error: ${error.message}`,
                environment: config.env,
                traceId: 'worker',
            });
        }
    });

    console.log('Project export worker started');
};
