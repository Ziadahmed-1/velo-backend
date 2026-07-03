import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { BillingInterval } from '../../../common/enums';

export class CreatePlanDto {
  @IsString() name: string;
  @IsNumber() basePriceEgp: number;
  @IsNumber() includedOrdersPerPeriod: number;
  @IsNumber() overagePricePerOrderEgp: number;
  @IsOptional() @IsEnum(BillingInterval) billingInterval?: BillingInterval;
  @IsOptional() @IsArray() features?: string[];
}
