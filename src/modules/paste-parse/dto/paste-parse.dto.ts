import { IsString } from 'class-validator';

export class PasteParseDto {
  /** Raw text from WhatsApp message or copied text */
  @IsString()
  text: string;
}
