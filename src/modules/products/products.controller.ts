import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateVariantFromSuggestionDto } from './dto/suggested-item.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiOperation({
    summary: 'List item suggestions',
    description:
      'Returns undismissed LLM-generated item suggestions (no-match items) for this account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions returned successfully.',
  })
  @Get('suggestions')
  getSuggestions(@CurrentAccount() user: RequestUser) {
    return this.productsService.getSuggestions(user.accountId);
  }

  @ApiOperation({
    summary: 'Dismiss a suggestion',
    description:
      'Marks a suggestion as dismissed so it no longer appears in the list.',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion dismissed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Suggestion not found.' })
  @Patch('suggestions/:id/dismiss')
  dismissSuggestion(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.productsService.dismissSuggestion(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Create variant from suggestion',
    description:
      'Creates a product variant from an LLM-generated suggestion and links it.',
  })
  @ApiResponse({
    status: 201,
    description: 'Variant created from suggestion successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Suggestion or parent product not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Suggestion already has a linked variant.',
  })
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

  @ApiOperation({
    summary: 'Create a product',
    description: 'Creates a new product for this account.',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @Post()
  create(@CurrentAccount() user: RequestUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.accountId, dto);
  }

  @ApiOperation({
    summary: 'List all products',
    description:
      'Returns all products for this account with variants and attributes.',
  })
  @ApiResponse({ status: 200, description: 'Products returned successfully.' })
  @Get()
  findAll(@CurrentAccount() user: RequestUser) {
    return this.productsService.findAll(user.accountId);
  }

  @ApiOperation({
    summary: 'Get product detail',
    description: 'Returns a single product by ID with variants and attributes.',
  })
  @ApiResponse({ status: 200, description: 'Product returned successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Get(':id')
  findOne(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.productsService.findOne(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Create variant',
    description: 'Creates a new variant under an existing product.',
  })
  @ApiResponse({ status: 201, description: 'Variant created successfully.' })
  @ApiResponse({ status: 404, description: 'Parent product not found.' })
  @Post(':id/variants')
  createVariant(
    @CurrentAccount() user: RequestUser,
    @Param('id') pid: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.createVariant(user.accountId, pid, dto);
  }
}
