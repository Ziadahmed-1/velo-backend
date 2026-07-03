import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierRemittance } from './entities/courier-remittance.entity';
import { CourierRemittanceLine } from './entities/courier-remittance-line.entity';
import { RemittanceStatus } from '../../common/enums';

@Injectable()
export class RemittanceService {
  constructor(
    @InjectRepository(CourierRemittance)
    private remittanceRepo: Repository<CourierRemittance>,
    @InjectRepository(CourierRemittanceLine)
    private lineRepo: Repository<CourierRemittanceLine>,
  ) {}

  async findAll(accountId: string) {
    return this.remittanceRepo.find({ where: { accountId } });
  }

  async findOne(accountId: string, id: string) {
    const remittance = await this.remittanceRepo.findOne({
      where: { id, accountId },
      relations: ['lines'],
    });

    if (!remittance) {
      throw new NotFoundException('Remittance not found');
    }

    return remittance;
  }

  async reconcile(accountId: string, id: string) {
    const remittance = await this.remittanceRepo.findOne({
      where: { id, accountId },
      relations: ['lines'],
    });

    if (!remittance) {
      throw new NotFoundException('Remittance not found');
    }

    const allSettled = remittance.lines.every((line) => {
      return parseFloat(line.expectedAmount) === parseFloat(line.receivedAmount);
    });

    if (allSettled) {
      await this.remittanceRepo.update(id, {
        status: RemittanceStatus.SETTLED,
        receivedAmount: remittance.expectedAmount,
      });
    } else {
      await this.remittanceRepo.update(id, {
        status: RemittanceStatus.PARTIAL,
      });
    }

    return this.findOne(accountId, id);
  }
}
