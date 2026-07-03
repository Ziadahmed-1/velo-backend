import { IsString, IsOptional, IsBoolean } from 'class-validator';
export class CreateProductDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
