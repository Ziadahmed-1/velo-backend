import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from './common/common.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CourierModule } from './modules/courier/courier.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { PasteParseModule } from './modules/paste-parse/paste-parse.module';
import { RfmModule } from './queues/rfm/rfm.module';
import { OverageModule } from './queues/overage/overage.module';
import { SuspensionModule } from './queues/suspension/suspension.module';
import { RemittanceModule } from './queues/remittance/remittance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: +config.get('REDIS_PORT', 6379),
        },
      }),
    }),
    AccountsModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    OrdersModule,
    CourierModule,
    BillingModule,
    WhatsAppModule,
    PasteParseModule,
    RfmModule,
    OverageModule,
    SuspensionModule,
    RemittanceModule,
  ],
})
export class AppModule {}
