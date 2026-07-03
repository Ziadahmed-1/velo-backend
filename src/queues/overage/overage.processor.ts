import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OVERAGE_QUEUE } from '../queue.constants';

@Processor(OVERAGE_QUEUE)
export class OverageProcessor extends WorkerHost {
  private readonly logger = new Logger(OverageProcessor.name);

  async process(
    job: Job<{ subscriptionId: string; accountId: string }>,
  ): Promise<void> {
    this.logger.log(
      `Overage check for subscription ${job.data.subscriptionId}`,
    );
    await Promise.resolve();
  }
}
