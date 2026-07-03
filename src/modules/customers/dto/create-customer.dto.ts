import { IsString, IsOptional } from 'class-validator';
export class CreateCustomerDto {
  @IsString() phone: string;
  @IsString() name: string;
  @IsString() governorate: string;
  @IsString() district: string;
  @IsString() streetAddress: string;
  @IsOptional() @IsString() landmark?: string;
}
