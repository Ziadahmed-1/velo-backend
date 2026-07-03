import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}
  @Post() create(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.accountId, dto);
  }
  @Get() findAll(@CurrentAccount() user: RequestUser) {
    return this.customersService.findAll(user.accountId);
  }
  @Get(':id') findOne(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(user.accountId, id);
  }
}
