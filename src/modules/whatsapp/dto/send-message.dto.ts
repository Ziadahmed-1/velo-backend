import { IsString } from 'class-validator';
export class SendMessageDto {
  @IsString() to: string;
  @IsString() text: string;
}
