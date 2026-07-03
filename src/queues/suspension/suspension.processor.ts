import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SUSPENSION_QUEUE } from '../queue.constants';

@Processor(SUSPENSION_QUEUE)
export class SuspensionProcessor extends WorkerHost {
  private readonly logger = new Logger(SuspensionProcessor.name);

  async process(
    job: Job<{ accountId: string; subscriptionId: string }>,
  ): Promise<void> {
    this.logger.log(`Suspension check for account ${job.data.accountId}`);
    await Promise.resolve();
  }
}
