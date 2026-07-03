import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private planRepo: Repository<Plan>) {}

  async create(dto: CreatePlanDto) {
    return this.planRepo.save(
      this.planRepo.create({
        name: dto.name,
        basePriceEgp: dto.basePriceEgp.toFixed(2),
        includedOrdersPerPeriod: dto.includedOrdersPerPeriod,
        overagePricePerOrderEgp: dto.overagePricePerOrderEgp.toFixed(2),
        billingInterval: dto.billingInterval,
        features: dto.features || [],
      }),
    );
  }

  async findAll() {
    return this.planRepo.find({
      where: { isActive: true },
      order: { basePriceEgp: 'ASC' },
    });
  }

  async findOne(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async findByName(name: string) {
    return this.planRepo.findOne({ where: { name } });
  }
}
