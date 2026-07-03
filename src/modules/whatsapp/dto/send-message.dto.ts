import { IsString } from 'class-validator';
export class SendMessageDto {
  /** Phone number to send message to (international format, no +) */
  @IsString() to: string;
  /** Message text content */
  @IsString() text: string;
}
