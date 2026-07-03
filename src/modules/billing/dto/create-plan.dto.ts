import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { BillingInterval } from '../../../common/enums';

export class CreatePlanDto {
  /** Display name of the plan (e.g. "Starter", "Professional") */
  @IsString() name: string;
  /** Base price in EGP per billing interval */
  @IsNumber() basePriceEgp: number;
  /** Number of orders included per billing period */
  @IsNumber() includedOrdersPerPeriod: number;
  /** Price per overage order in EGP */
  @IsNumber() overagePricePerOrderEgp: number;
  /** Billing interval (monthly/yearly) */
  @IsOptional() @IsEnum(BillingInterval) billingInterval?: BillingInterval;
  /** List of plan feature descriptions */
  @IsOptional() @IsArray() features?: string[];
}
