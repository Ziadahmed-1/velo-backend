import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @ApiOperation({
    summary: 'Get variant stock',
    description:
      'Returns the current stock level for a variant (sum of all ledger entries).',
  })
  @ApiResponse({ status: 200, description: 'Stock returned successfully.' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  @Get('variants/:variantId/stock')
  getStock(
    @CurrentAccount() user: RequestUser,
    @Param('variantId') variantId: string,
  ) {
    return this.inventoryService.getStock(user.accountId, variantId);
  }

  @ApiOperation({
    summary: 'Adjust stock',
    description:
      'Adds a ledger entry to adjust stock. Positive quantity = restock, negative = adjustment.',
  })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully.' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  @Post('adjust')
  adjust(@CurrentAccount() user: RequestUser, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjust(user.accountId, dto);
  }
}
