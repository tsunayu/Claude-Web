import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CollectorFactory } from '../collectors/factory';
import { CollectedContent } from '../collectors/base';
import { notificationService } from './notification.service';

// Redis connection
const connection = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  maxRetriesPerRequest: null,
});

// Create queue
const collectQueue = new Queue('data-collection', { connection });

// Job data interface
interface CollectJobData {
  sourceId: string;
  userId: string;
  force?: boolean;
}

export class JobService {
  async createCollectJob(sourceId: string, userId: string, force: boolean = false) {
    // Verify data source exists and belongs to user
    const dataSource = await prisma.dataSource.findFirst({
      where: { id: sourceId, userId },
    });

    if (!dataSource) {
      throw new AppError('Data source not found', 404, 'DATA_SOURCE_NOT_FOUND');
    }

    if (!dataSource.isActive) {
      throw new AppError('Data source is not active', 400, 'DATA_SOURCE_INACTIVE');
    }

    // Check if job was recently run (unless forced)
    if (!force && dataSource.lastCheckedAt) {
      const timeSinceLastCheck = Date.now() - dataSource.lastCheckedAt.getTime();
      const minInterval = dataSource.checkInterval * 1000; // Convert to milliseconds

      if (timeSinceLastCheck < minInterval) {
        const waitTime = Math.ceil((minInterval - timeSinceLastCheck) / 1000);
        throw new AppError(
          `Please wait ${waitTime} seconds before collecting again`,
          429,
          'TOO_MANY_REQUESTS'
        );
      }
    }

    // Create job
    const job = await collectQueue.add(
      'collect',
      {
        sourceId,
        userId,
        force,
      } as CollectJobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100, // Keep max 100 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      }
    );

    // Update lastCheckedAt
    await prisma.dataSource.update({
      where: { id: sourceId },
      data: { lastCheckedAt: new Date() },
    });

    return {
      jobId: job.id,
      sourceId,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  async getJobStatus(jobId: string) {
    const job = await collectQueue.getJob(jobId);

    if (!job) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    }

    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;
    const returnValue = job.returnvalue;

    return {
      jobId: job.id,
      status: state,
      progress,
      data: job.data,
      result: returnValue,
      error: failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      collectQueue.getWaitingCount(),
      collectQueue.getActiveCount(),
      collectQueue.getCompletedCount(),
      collectQueue.getFailedCount(),
      collectQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}

/**
 * Saves collected data items to the database
 * Skips duplicates based on URL
 * Returns array of saved data IDs
 */
async function saveCollectedData(items: CollectedContent[], dataSourceId: string): Promise<string[]> {
  const savedIds: string[] = [];

  for (const item of items) {
    try {
      // Check if item already exists by URL
      const existing = await prisma.collectedData.findUnique({
        where: { url: item.url },
      });

      if (existing) {
        console.log(`[Worker] Skipping duplicate item: ${item.url}`);
        continue;
      }

      // Create new collected data entry
      const saved = await prisma.collectedData.create({
        data: {
          dataSourceId,
          title: item.title,
          content: item.content,
          summary: item.summary || item.content.substring(0, 200),
          url: item.url,
          author: item.author,
          publishedAt: item.publishedAt,
          imageUrl: item.imageUrl,
          tags: item.tags || [],
          categories: item.categories || [],
          language: item.language,
          metadata: {
            collectedAt: new Date().toISOString(),
            source: item.author,
          },
          isProcessed: false,
          sentiment: null,
          keywords: [],
        },
      });

      savedIds.push(saved.id);

      // Trigger notification matching asynchronously
      notificationService.matchAndNotify(saved.id).catch((error) => {
        console.error(`[Worker] Notification matching error for ${saved.id}:`, error);
      });
    } catch (error) {
      console.error(`[Worker] Error saving item ${item.url}:`, error);
      // Continue with other items even if one fails
    }
  }

  return savedIds;
}

// Worker to process jobs (this would typically be in a separate process)
export function startCollectWorker() {
  const worker = new Worker(
    'data-collection',
    async (job: Job<CollectJobData>) => {
      const { sourceId, userId } = job.data;

      console.log(`[Worker] Processing collect job for source ${sourceId}`);

      // Get data source
      const dataSource = await prisma.dataSource.findFirst({
        where: { id: sourceId, userId },
      });

      if (!dataSource) {
        throw new Error('Data source not found');
      }

      await job.updateProgress(10);

      // Validate data source configuration
      try {
        CollectorFactory.validate(dataSource);
      } catch (error) {
        console.error(`[Worker] Invalid data source configuration:`, error);
        throw error;
      }

      await job.updateProgress(20);

      // Create collector
      const collector = CollectorFactory.create(dataSource);

      console.log(`[Worker] Created ${dataSource.type} collector for: ${dataSource.name}`);

      await job.updateProgress(30);

      // Collect data
      const result = await collector.collect();

      await job.updateProgress(60);

      if (!result.success) {
        throw new Error(result.error || 'Data collection failed');
      }

      console.log(`[Worker] Collected ${result.itemsCollected} items from ${dataSource.name}`);

      // Save collected items to database
      let savedIds: string[] = [];
      if (result.items && result.items.length > 0) {
        savedIds = await saveCollectedData(result.items, dataSource.id);
      }

      await job.updateProgress(90);

      // Update data source
      await prisma.dataSource.update({
        where: { id: sourceId },
        data: {
          lastSuccessAt: new Date(),
          errorCount: 0,
          lastError: null,
        },
      });

      await job.updateProgress(100);

      console.log(`[Worker] Job completed. Saved ${savedIds.length}/${result.itemsCollected} new items`);

      return {
        success: true,
        itemsCollected: result.itemsCollected,
        savedItems: savedIds.length,
        savedIds,
        message: 'Data collection job completed successfully',
      };
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);

    if (job) {
      const { sourceId } = job.data;

      // Update error count
      await prisma.dataSource.update({
        where: { id: sourceId },
        data: {
          errorCount: { increment: 1 },
          lastError: err.message,
        },
      });
    }
  });

  console.log('Collect worker started');

  return worker;
}

export const jobService = new JobService();
