import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CourierService } from './courier.service';
import { RemittanceService } from './remittance.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('courier')
export class CourierController {
  constructor(
    private courierService: CourierService,
    private remittanceService: RemittanceService,
  ) {}

  @Post('shipments')
  createShipment(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.courierService.createShipment(user.accountId, dto.orderId);
  }

  @Post('webhooks/bosta')
  @Public()
  handleBostaWebhook(@Body() payload: unknown) {
    return this.courierService.handleWebhook('bosta', payload);
  }

  @Post('webhooks/mylerz')
  @Public()
  handleMylerzWebhook(@Body() payload: unknown) {
    return this.courierService.handleWebhook('mylerz', payload);
  }

  @Get('remittances')
  getRemittances(@CurrentAccount() user: RequestUser) {
    return this.remittanceService.findAll(user.accountId);
  }

  @Get('remittances/:id')
  getRemittance(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.remittanceService.findOne(user.accountId, id);
  }
}
