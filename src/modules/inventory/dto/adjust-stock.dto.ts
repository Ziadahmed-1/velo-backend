import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { LedgerReason } from '../../../common/enums';

/** Payload to adjust inventory stock */
export class AdjustStockDto {
  /** ID of the variant to adjust stock for */
  @IsString()
  variantId: string;

  /** Quantity change (positive = restock, negative = adjustment) */
  @IsInt()
  quantity: number;

  /** Reason for the adjustment */
  @IsEnum(LedgerReason)
  reason: LedgerReason;

  /** Optional audit note */
  @IsOptional()
  @IsString()
  auditNote?: string;
}
