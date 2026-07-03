import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SuspensionProcessor } from './suspension.processor';
import { SUSPENSION_QUEUE } from '../queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: SUSPENSION_QUEUE })],
  providers: [SuspensionProcessor],
})
export class SuspensionModule {}
