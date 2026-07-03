import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('variants/:variantId/stock')
  getStock(
    @CurrentAccount() user: RequestUser,
    @Param('variantId') variantId: string,
  ) {
    return this.inventoryService.getStock(user.accountId, variantId);
  }

  @Post('adjust')
  adjust(@CurrentAccount() user: RequestUser, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjust(user.accountId, dto);
  }
}
