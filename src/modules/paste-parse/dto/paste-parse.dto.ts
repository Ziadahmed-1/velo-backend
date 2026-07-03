import { IsString } from 'class-validator';

export class PasteParseDto {
  @IsString()
  text: string;
}
