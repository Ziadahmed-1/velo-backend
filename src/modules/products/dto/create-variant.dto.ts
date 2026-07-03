import { IsString, IsOptional, IsObject } from 'class-validator';
export class CreateVariantDto {
  @IsString() sku: string;
  @IsString() price: string;
  @IsString() costPrice: string;
  @IsOptional() @IsObject() attributesJson?: Record<string, string>;
}
