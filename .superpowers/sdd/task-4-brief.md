### Task 4: Products Module — Entities + CRUD

**Files:**
- Create: `src/modules/products/entities/product.entity.ts`
- Create: `src/modules/products/entities/product-variant.entity.ts`
- Create: `src/modules/products/entities/attribute.entity.ts`
- Create: `src/modules/products/entities/attribute-value.entity.ts`
- Create: `src/modules/products/dto/create-product.dto.ts`
- Create: `src/modules/products/dto/create-variant.dto.ts`
- Create: `src/modules/products/products.service.ts`
- Create: `src/modules/products/products.controller.ts`
- Create: `src/modules/products/products.module.ts`

- [ ] **Step 1: Copy 4 product entity files from reference**

- [ ] **Step 2: Create DTOs**

`src/modules/products/dto/create-product.dto.ts`:
```typescript
import { IsString, IsOptional, IsBoolean } from 'class-validator';
export class CreateProductDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
```

`src/modules/products/dto/create-variant.dto.ts`:
```typescript
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
export class CreateVariantDto {
  @IsString() sku: string;
  @IsNumber() price: number;
  @IsNumber() costPrice: number;
  @IsOptional() @IsObject() attributesJson?: Record<string, string>;
}
```

- [ ] **Step 3: Create ProductsService**

`src/modules/products/products.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
  ) {}

  async create(accountId: string, dto: CreateProductDto) {
    return this.productRepo.save(this.productRepo.create({ ...dto, accountId }));
  }

  async findAll(accountId: string) {
    return this.productRepo.find({ where: { accountId }, relations: ['variants', 'attributes'] });
  }

  async findOne(accountId: string, id: string) {
    const product = await this.productRepo.findOne({ where: { id, accountId }, relations: ['variants', 'attributes'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createVariant(accountId: string, productId: string, dto: CreateVariantDto) {
    await this.findOne(accountId, productId);
    return this.variantRepo.save(this.variantRepo.create({ ...dto, accountId, productId }));
  }
}
```

- [ ] **Step 4: Create ProductsController**

`src/modules/products/products.controller.ts`:
```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}
  @Post() create(@CurrentAccount() user: any, @Body() dto: CreateProductDto) { return this.productsService.create(user.accountId, dto); }
  @Get() findAll(@CurrentAccount() user: any) { return this.productsService.findAll(user.accountId); }
  @Get(':id') findOne(@CurrentAccount() user: any, @Param('id') id: string) { return this.productsService.findOne(user.accountId, id); }
  @Post(':id/variants') createVariant(@CurrentAccount() user: any, @Param('id') pid: string, @Body() dto: CreateVariantDto) { return this.productsService.createVariant(user.accountId, pid, dto); }
}
```

- [ ] **Step 5: Create ProductsModule**

`src/modules/products/products.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, Attribute, AttributeValue])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

- [ ] **Step 6: Build + Commit**

```bash
npx nest build
git add src/modules/products/
git commit -m "feat: add products module with entities and CRUD"
```

---


