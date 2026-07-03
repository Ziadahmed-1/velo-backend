import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasteParseController } from './paste-parse.controller';
import { PasteParseService } from './paste-parse.service';
import { ExtractionService } from './extraction.service';
import { CatalogMatcherService } from './catalog-matcher.service';
import { Customer } from '../customers/entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { SuggestedItem } from '../products/entities/suggested-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Order,
      OrderItem,
      ProductVariant,
      SuggestedItem,
    ]),
  ],
  controllers: [PasteParseController],
  providers: [PasteParseService, ExtractionService, CatalogMatcherService],
  exports: [ExtractionService, CatalogMatcherService],
})
export class PasteParseModule {}
