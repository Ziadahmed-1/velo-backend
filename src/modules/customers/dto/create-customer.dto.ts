import { IsString, IsOptional } from 'class-validator';

/** Payload to create a new customer */
export class CreateCustomerDto {
  /** Customer phone number */
  @IsString() phone: string;
  /** Customer full name */
  @IsString() name: string;
  /** Governorate / region */
  @IsString() governorate: string;
  /** District / area */
  @IsString() district: string;
  /** Street address details */
  @IsString() streetAddress: string;
  /** Optional nearby landmark */
  @IsOptional() @IsString() landmark?: string;
}
