import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PasteParseService } from './paste-parse.service';
import { PasteParseDto } from './dto/paste-parse.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Paste Parse')
@Controller('paste-parse')
export class PasteParseController {
  constructor(private pasteParseService: PasteParseService) {}

  @ApiOperation({
    summary: 'Parse raw text and create draft order',
    description:
      'Extracts structured order data from raw text via LLM, matches items against merchant catalog, creates/updates customer, and returns a draft Order with SuggestedItem upserts.',
  })
  @ApiResponse({
    status: 201,
    description: 'Draft order created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({
    status: 502,
    description: 'Extraction or catalog matching service unavailable.',
  })
  @Post()
  parse(@CurrentAccount() user: RequestUser, @Body() dto: PasteParseDto) {
    return this.pasteParseService.parse(user.accountId, dto);
  }
}
