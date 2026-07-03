import { IsString, IsOptional, IsBoolean } from 'class-validator';

/** Payload to create a new product */
export class CreateProductDto {
  /** Product display name */
  @IsString() title: string;
  /** Optional product description */
  @IsOptional() @IsString() description?: string;
  /** Whether the product is active (default true) */
  @IsOptional() @IsBoolean() isActive?: boolean;
}
