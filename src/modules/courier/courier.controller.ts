import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CourierService } from './courier.service';
import { RemittanceService } from './remittance.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Courier')
@Controller('courier')
export class CourierController {
  constructor(
    private courierService: CourierService,
    private remittanceService: RemittanceService,
  ) {}

  @ApiOperation({
    summary: 'Create a shipment',
    description:
      'Creates a shipment via the configured courier provider (Bosta or Mylerz).',
  })
  @ApiResponse({ status: 201, description: 'Shipment created successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Order not found or no courier provider assigned.',
  })
  @Post('shipments')
  createShipment(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.courierService.createShipment(user.accountId, dto.orderId);
  }

  @ApiOperation({
    summary: 'Bosta webhook receiver',
    description: 'Receives delivery status updates from Bosta.',
  })
  @Post('webhooks/bosta')
  @Public()
  handleBostaWebhook(@Body() payload: unknown) {
    return this.courierService.handleWebhook('bosta', payload);
  }

  @ApiOperation({
    summary: 'Mylerz webhook receiver',
    description: 'Receives delivery status updates from Mylerz.',
  })
  @Post('webhooks/mylerz')
  @Public()
  handleMylerzWebhook(@Body() payload: unknown) {
    return this.courierService.handleWebhook('mylerz', payload);
  }

  @ApiOperation({
    summary: 'List remittance batches',
    description: 'Returns all remittance batches for the current account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Remittance batches returned successfully.',
  })
  @Get('remittances')
  getRemittances(@CurrentAccount() user: RequestUser) {
    return this.remittanceService.findAll(user.accountId);
  }

  @ApiOperation({
    summary: 'Get remittance detail',
    description: 'Returns a single remittance batch with its lines.',
  })
  @ApiResponse({
    status: 200,
    description: 'Remittance detail returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Remittance not found.' })
  @Get('remittances/:id')
  getRemittance(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.remittanceService.findOne(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Reconcile remittance',
    description:
      'Matches received amounts against expected amounts for a remittance batch. Updates status to SETTLED or PARTIAL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Remittance reconciled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Remittance not found.' })
  @Post('remittances/:id/reconcile')
  reconcileRemittance(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.remittanceService.reconcile(user.accountId, id);
  }
}
