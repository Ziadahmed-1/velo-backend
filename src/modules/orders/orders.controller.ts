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
