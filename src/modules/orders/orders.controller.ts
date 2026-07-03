import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}
  @Post() create(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: RequestUser) {
    return this.ordersService.findAll(user.accountId);
  }
  @Get(':id') findOne(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(user.accountId, id);
  }
}
