import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}
  @Post() create(@CurrentAccount() user: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: any) {
    return this.productsService.findAll(user.accountId);
  }
  @Get(':id') findOne(@CurrentAccount() user: any, @Param('id') id: string) {
    return this.productsService.findOne(user.accountId, id);
  }
  @Post(':id/variants') createVariant(
    @CurrentAccount() user: any,
    @Param('id') pid: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.createVariant(user.accountId, pid, dto);
  }
}
