### Task 6: Customers + Orders Modules

**Files:**

- Create: `src/modules/customers/entities/customer.entity.ts`
- Create: `src/modules/customers/dto/create-customer.dto.ts`
- Create: `src/modules/customers/customers.service.ts`
- Create: `src/modules/customers/customers.controller.ts`
- Create: `src/modules/customers/customers.module.ts`
- Create: `src/modules/orders/entities/order.entity.ts`
- Create: `src/modules/orders/entities/order-item.entity.ts`
- Create: `src/modules/orders/entities/invoice.entity.ts`
- Create: `src/modules/orders/dto/create-order.dto.ts`
- Create: `src/modules/orders/orders.service.ts`
- Create: `src/modules/orders/orders.controller.ts`
- Create: `src/modules/orders/orders.module.ts`

- [ ] **Step 1: Copy Customer + Order entities from reference** (4 files)

- [ ] **Step 2: Create Customer DTO + Service + Controller**

`src/modules/customers/dto/create-customer.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator';
export class CreateCustomerDto {
  @IsString() phone: string;
  @IsString() name: string;
  @IsString() governorate: string;
  @IsString() district: string;
  @IsString() streetAddress: string;
  @IsOptional() @IsString() landmark?: string;
}
```

`src/modules/customers/customers.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}
  async create(accountId: string, dto: CreateCustomerDto) {
    return this.customerRepo.save(
      this.customerRepo.create({ ...dto, accountId }),
    );
  }
  async findAll(accountId: string) {
    return this.customerRepo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }
  async findOne(accountId: string, id: string) {
    const c = await this.customerRepo.findOne({ where: { id, accountId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }
}
```

`src/modules/customers/customers.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}
  @Post() create(@CurrentAccount() user: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: any) {
    return this.customersService.findAll(user.accountId);
  }
  @Get(':id') findOne(@CurrentAccount() user: any, @Param('id') id: string) {
    return this.customersService.findOne(user.accountId, id);
  }
}
```

`src/modules/customers/customers.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
```

- [ ] **Step 3: Create Order DTO**

`src/modules/orders/dto/create-order.dto.ts`:

```typescript
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() variantId: string;
  @IsNumber() quantity: number;
  @IsNumber() price: number;
}

export class CreateOrderDto {
  @IsString() customerId: string;
  @IsNumber() subTotal: number;
  @IsNumber() shippingFee: number;
  @IsNumber() vatAmount: number;
  @IsNumber() totalAmount: number;
  @IsOptional() @IsString() courierProvider?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

- [ ] **Step 4: Create OrdersService** (atomic order + stock reservation)

`src/modules/orders/orders.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { LedgerReason, OrderSourceChannel } from '../../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async create(accountId: string, dto: CreateOrderDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const order = await qr.manager.save(
        qr.manager.create(Order, {
          accountId,
          customerId: dto.customerId,
          subTotal: dto.subTotal.toString(),
          shippingFee: dto.shippingFee.toString(),
          vatAmount: dto.vatAmount.toString(),
          totalAmount: dto.totalAmount.toString(),
          courierProvider: dto.courierProvider || null,
          sourceChannel: OrderSourceChannel.MANUAL,
        }),
      );
      for (const item of dto.items) {
        await qr.manager.save(
          qr.manager.create(OrderItem, {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price.toString(),
          }),
        );
        await qr.manager.save(
          qr.manager.create(InventoryLedger, {
            variantId: item.variantId,
            quantity: -item.quantity,
            reason: LedgerReason.ORDER_RESERVATION,
            orderId: order.id,
          }),
        );
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      await qr.manager.save(
        qr.manager.create(Invoice, {
          orderId: order.id,
          invoiceNumber: `INV-${dateStr}-${order.id.substring(0, 4).toUpperCase()}`,
        }),
      );
      await qr.commitTransaction();
      return this.orderRepo.findOne({
        where: { id: order.id },
        relations: ['orderItems', 'invoice'],
      });
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(accountId: string) {
    return this.orderRepo.find({
      where: { accountId },
      relations: ['orderItems', 'customer', 'invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(accountId: string, id: string) {
    const o = await this.orderRepo.findOne({
      where: { id, accountId },
      relations: ['orderItems', 'customer', 'invoice'],
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }
}
```

- [ ] **Step 5: Create OrdersController + Module**

`src/modules/orders/orders.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}
  @Post() create(@CurrentAccount() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: any) {
    return this.ordersService.findAll(user.accountId);
  }
  @Get(':id') findOne(@CurrentAccount() user: any, @Param('id') id: string) {
    return this.ordersService.findOne(user.accountId, id);
  }
}
```

`src/modules/orders/orders.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Invoice, InventoryLedger]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

- [ ] **Step 6: Build + Commit**

```bash
npx nest build
git add src/modules/customers/ src/modules/orders/
git commit -m "feat: add customers and orders modules with atomic stock reservation"
```

---
