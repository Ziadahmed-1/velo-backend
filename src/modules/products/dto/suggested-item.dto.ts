import { IsString, IsNumber, IsOptional } from 'class-validator';
export class CreateVariantFromSuggestionDto {
  @IsString() productId: string;
  @IsString() sku: string;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() costPrice?: number;
}
