import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { LedgerReason } from '../../../common/enums';

export class AdjustStockDto {
  @IsString()
  variantId: string;

  @IsInt()
  quantity: number;

  @IsEnum(LedgerReason)
  reason: LedgerReason;

  @IsOptional()
  @IsString()
  auditNote?: string;
}
