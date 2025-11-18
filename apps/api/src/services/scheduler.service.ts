import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { jobService } from './job.service';

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Starts the scheduler and sets up periodic checks for data sources
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Scheduler] Starting scheduler service');

    // Check every minute for data sources that need to be collected
    cron.schedule('* * * * *', async () => {
      await this.checkAndScheduleCollections();
    });

    // Initial run
    await this.checkAndScheduleCollections();

    console.log('[Scheduler] Scheduler service started successfully');
  }

  /**
   * Stops the scheduler and cancels all scheduled tasks
   */
  stop(): void {
    console.log('[Scheduler] Stopping scheduler service');

    this.tasks.forEach((task) => {
      task.stop();
    });
    this.tasks.clear();

    this.isRunning = false;
    console.log('[Scheduler] Scheduler service stopped');
  }

  /**
   * Checks all active data sources and schedules collections if needed
   */
  private async checkAndScheduleCollections(): Promise<void> {
    try {
      // Find all active data sources
      const dataSources = await prisma.dataSource.findMany({
        where: {
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              subscriptionTier: true,
            },
          },
        },
      });

      const now = new Date();

      for (const dataSource of dataSources) {
        try {
          // Check if it's time to collect
          const shouldCollect = this.shouldCollect(dataSource, now);

          if (shouldCollect) {
            console.log(`[Scheduler] Scheduling collection for data source: ${dataSource.name} (${dataSource.id})`);

            // Create a collection job
            await jobService.createCollectJob(dataSource.id, dataSource.userId, false);

            console.log(`[Scheduler] Collection job created for: ${dataSource.name}`);
          }
        } catch (error) {
          console.error(`[Scheduler] Error scheduling collection for ${dataSource.name}:`, error);

          // Update error count
          await prisma.dataSource.update({
            where: { id: dataSource.id },
            data: {
              errorCount: { increment: 1 },
              lastError: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error in checkAndScheduleCollections:', error);
    }
  }

  /**
   * Determines if a data source should be collected based on its checkInterval
   */
  private shouldCollect(dataSource: any, now: Date): boolean {
    // If never checked, collect immediately
    if (!dataSource.lastCheckedAt) {
      return true;
    }

    // Calculate time since last check (in seconds)
    const timeSinceLastCheck = Math.floor((now.getTime() - dataSource.lastCheckedAt.getTime()) / 1000);

    // Check if enough time has passed based on checkInterval
    return timeSinceLastCheck >= dataSource.checkInterval;
  }

  /**
   * Manually triggers a collection for a specific data source
   */
  async triggerCollection(dataSourceId: string, userId: string): Promise<void> {
    console.log(`[Scheduler] Manually triggering collection for data source: ${dataSourceId}`);

    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    });

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    if (dataSource.userId !== userId) {
      throw new Error('Unauthorized: Data source does not belong to user');
    }

    if (!dataSource.isActive) {
      throw new Error('Cannot collect from inactive data source');
    }

    await jobService.createCollectJob(dataSourceId, userId, true);
  }

  /**
   * Gets statistics about the scheduler
   */
  getStats(): {
    isRunning: boolean;
    activeTasks: number;
  } {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.size,
    };
  }

  /**
   * Forces a refresh of all scheduled tasks
   */
  async refresh(): Promise<void> {
    console.log('[Scheduler] Refreshing scheduled tasks');
    await this.checkAndScheduleCollections();
  }
}

export const schedulerService = new SchedulerService();
