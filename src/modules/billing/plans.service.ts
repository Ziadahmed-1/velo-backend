import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

/**
 * CRUD for subscription plans.
 */
@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private planRepo: Repository<Plan>) {}

  /**
   * Create a new subscription plan.
   * @param dto - Plan creation data
   * @returns The created Plan
   */
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

  /**
   * Get all active plans ordered by price ascending.
   * @returns List of active plans
   */
  async findAll() {
    return this.planRepo.find({
      where: { isActive: true },
      order: { basePriceEgp: 'ASC' },
    });
  }

  /**
   * Find a plan by its ID.
   * @param id - Plan ID
   * @returns The Plan entity
   */
  async findOne(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  /**
   * Find a plan by its name (e.g. "Trial").
   * @param name - Plan name
   * @returns The Plan entity or null
   */
  async findByName(name: string) {
    return this.planRepo.findOne({ where: { name } });
  }
}
