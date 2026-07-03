import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RemittanceProcessor } from './remittance.processor';
import { REMITTANCE_QUEUE } from '../queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: REMITTANCE_QUEUE })],
  providers: [RemittanceProcessor],
})
export class RemittanceModule {}
