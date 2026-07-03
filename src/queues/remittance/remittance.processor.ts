import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { REMITTANCE_QUEUE } from '../queue.constants';

@Processor(REMITTANCE_QUEUE)
export class RemittanceProcessor extends WorkerHost {
  private readonly logger = new Logger(RemittanceProcessor.name);

  async process(
    job: Job<{ remittanceId: string; accountId: string }>,
  ): Promise<void> {
    this.logger.log(`Remittance reconcile for ${job.data.remittanceId}`);
    await Promise.resolve();
  }
}
