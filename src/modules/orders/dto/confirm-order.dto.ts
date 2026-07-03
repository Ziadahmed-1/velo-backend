import { IsOptional, IsString } from 'class-validator';

/** Payload to confirm a draft order */
export class ConfirmOrderDto {
  /** Optional courier provider override */
  @IsOptional()
  @IsString()
  courierProvider?: string;
}
