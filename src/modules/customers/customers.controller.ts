import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @ApiOperation({
    summary: 'Create a customer',
    description: 'Creates a new customer record for this account.',
  })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  @Post()
  create(@CurrentAccount() user: RequestUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.accountId, dto);
  }

  @ApiOperation({
    summary: 'List all customers',
    description: 'Returns all customers for this account.',
  })
  @ApiResponse({ status: 200, description: 'Customers returned successfully.' })
  @Get()
  findAll(@CurrentAccount() user: RequestUser) {
    return this.customersService.findAll(user.accountId);
  }

  @ApiOperation({
    summary: 'Get customer by ID',
    description: 'Finds a customer by their unique ID.',
  })
  @ApiResponse({ status: 200, description: 'Customer returned successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Get(':id')
  findOne(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.customersService.findOne(user.accountId, id);
  }
}
