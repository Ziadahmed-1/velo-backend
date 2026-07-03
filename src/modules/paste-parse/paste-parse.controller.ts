import { Controller, Post, Body } from '@nestjs/common';
import { PasteParseService } from './paste-parse.service';
import { PasteParseDto } from './dto/paste-parse.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('paste-parse')
export class PasteParseController {
  constructor(private pasteParseService: PasteParseService) {}

  @Post()
  parse(@CurrentAccount() user: RequestUser, @Body() dto: PasteParseDto) {
    return this.pasteParseService.parse(user.accountId, dto);
  }
}
