import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RFM_QUEUE } from '../queue.constants';

@Processor(RFM_QUEUE)
export class RfmProcessor extends WorkerHost {
  private readonly logger = new Logger(RfmProcessor.name);

  async process(
    job: Job<{ orderId: string; accountId: string }>,
  ): Promise<void> {
    this.logger.log(
      `RFM job for order ${job.data.orderId} (account ${job.data.accountId})`,
    );
    await Promise.resolve();
  }
}
