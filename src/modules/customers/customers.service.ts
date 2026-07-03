import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}
  async create(accountId: string, dto: CreateCustomerDto) {
    return this.customerRepo.save(
      this.customerRepo.create({ ...dto, accountId }),
    );
  }
  async findAll(accountId: string) {
    return this.customerRepo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }
  async findOne(accountId: string, id: string) {
    const c = await this.customerRepo.findOne({ where: { id, accountId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }
}
