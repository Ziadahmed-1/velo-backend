import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateVariantFromSuggestionDto } from './dto/suggested-item.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('suggestions')
  getSuggestions(@CurrentAccount() user: RequestUser) {
    return this.productsService.getSuggestions(user.accountId);
  }

  @Patch('suggestions/:id/dismiss')
  dismissSuggestion(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.productsService.dismissSuggestion(user.accountId, id);
  }

  @Post('suggestions/:id/create-variant')
  createVariantFromSuggestion(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateVariantFromSuggestionDto,
  ) {
    return this.productsService.createVariantFromSuggestion(
      user.accountId,
      id,
      dto,
    );
  }

  @Post() create(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: RequestUser) {
    return this.productsService.findAll(user.accountId);
  }
  @Get(':id') findOne(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(user.accountId, id);
  }
  @Post(':id/variants') createVariant(
    @CurrentAccount() user: RequestUser,
    @Param('id') pid: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.createVariant(user.accountId, pid, dto);
  }
}
