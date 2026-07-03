import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}
  @Post() create(@CurrentAccount() user: any, @Body() dto: CreateCustomerDto) { return this.customersService.create(user.accountId, dto); }
  @Get() findAll(@CurrentAccount() user: any) { return this.customersService.findAll(user.accountId); }
  @Get(':id') findOne(@CurrentAccount() user: any, @Param('id') id: string) { return this.customersService.findOne(user.accountId, id); }
}
