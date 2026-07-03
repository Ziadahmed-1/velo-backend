import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OverageProcessor } from './overage.processor';
import { OVERAGE_QUEUE } from '../queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: OVERAGE_QUEUE })],
  providers: [OverageProcessor],
})
export class OverageModule {}
