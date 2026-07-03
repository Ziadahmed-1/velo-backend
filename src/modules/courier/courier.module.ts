import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { RemittanceService } from './remittance.service';
import { BostaProvider } from './providers/bosta.provider';
import { MylerzProvider } from './providers/mylerz.provider';
import { COURIER_PROVIDER } from './interfaces/courier-provider.interface';
import { CourierRemittance } from './entities/courier-remittance.entity';
import { CourierRemittanceLine } from './entities/courier-remittance-line.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierRemittance,
      CourierRemittanceLine,
      Order,
      Customer,
    ]),
  ],
  controllers: [CourierController],
  providers: [
    CourierService,
    RemittanceService,
    BostaProvider,
    MylerzProvider,
    {
      provide: COURIER_PROVIDER,
      useFactory: (bosta: BostaProvider, mylerz: MylerzProvider) => [
        bosta,
        mylerz,
      ],
      inject: [BostaProvider, MylerzProvider],
    },
  ],
})
export class CourierModule {}
