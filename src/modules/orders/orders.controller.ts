import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiOperation({
    summary: 'Create an order',
    description:
      'Creates an order atomically with items and stock reservation in a database transaction.',
  })
  @ApiResponse({ status: 201, description: 'Order created successfully.' })
  @Post()
  create(@CurrentAccount() user: RequestUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.accountId, dto);
  }

  @ApiOperation({
    summary: 'List all orders',
    description: 'Returns all orders with items, customer, and invoice.',
  })
  @ApiResponse({ status: 200, description: 'Orders returned successfully.' })
  @Get()
  findAll(@CurrentAccount() user: RequestUser) {
    return this.ordersService.findAll(user.accountId);
  }

  @ApiOperation({
    summary: 'Get order detail',
    description:
      'Returns a single order by ID with items, customer, and invoice.',
  })
  @ApiResponse({ status: 200, description: 'Order returned successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @Get(':id')
  findOne(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Confirm draft order',
    description:
      'Confirms a draft order, marks it as non-draft, and enqueues an RFM analytics job.',
  })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 400, description: 'Order is already confirmed.' })
  @Patch(':id/confirm')
  confirm(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
    @Body() dto?: ConfirmOrderDto,
  ) {
    return this.ordersService.confirmOrder(user.accountId, id, dto);
  }
}
