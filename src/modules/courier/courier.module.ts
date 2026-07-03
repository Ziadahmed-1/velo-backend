import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierRemittance } from './entities/courier-remittance.entity';
import { CourierRemittanceLine } from './entities/courier-remittance-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourierRemittance, CourierRemittanceLine])],
})
export class CourierModule {}
