import { IsString, IsNumber, IsOptional } from 'class-validator';

/** Payload to create a variant from an LLM-generated suggestion */
export class CreateVariantFromSuggestionDto {
  /** ID of the parent product */
  @IsString() productId: string;
  /** Stock keeping unit for the new variant */
  @IsString() sku: string;
  /** Selling price */
  @IsNumber() price: number;
  /** Optional cost price */
  @IsOptional() @IsNumber() costPrice?: number;
}
