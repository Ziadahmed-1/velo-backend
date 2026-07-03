import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('variants/:variantId/stock')
  getStock(@Param('variantId') variantId: string) {
    return this.inventoryService.getStock(variantId);
  }

  @Post('adjust')
  adjust(@CurrentAccount() user: any, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjust(user.accountId, dto);
  }
}
