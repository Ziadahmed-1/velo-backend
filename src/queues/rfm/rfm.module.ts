import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RfmProcessor } from './rfm.processor';
import { RFM_QUEUE } from '../queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: RFM_QUEUE })],
  providers: [RfmProcessor],
})
export class RfmModule {}
