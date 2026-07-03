import { IsString, IsOptional, IsObject } from 'class-validator';

/** Payload to create a product variant */
export class CreateVariantDto {
  /** Stock keeping unit identifier */
  @IsString() sku: string;
  /** Selling price as string (supports decimal precision) */
  @IsString() price: string;
  /** Cost price as string (supports decimal precision) */
  @IsString() costPrice: string;
  /** Optional JSON map of attribute key-value pairs */
  @IsOptional() @IsObject() attributesJson?: Record<string, string>;
}
