import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Billing Plans')
@Controller('billing/plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @ApiOperation({
    summary: 'Create subscription plan',
    description: 'Creates a new subscription plan. Admin only.',
  })
  @ApiResponse({ status: 201, description: 'Plan created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only.' })
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @ApiOperation({
    summary: 'List active plans',
    description:
      'Returns all active subscription plans ordered by price ascending.',
  })
  @ApiResponse({ status: 200, description: 'Plans list returned.' })
  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @ApiOperation({
    summary: 'Get plan by ID',
    description: 'Returns a single subscription plan by its ID.',
  })
  @ApiResponse({ status: 200, description: 'Plan found.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }
}
