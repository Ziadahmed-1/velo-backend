import { Controller, Post, Body, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRole } from '../../common/enums';

@ApiBearerAuth()
@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('me')
  getProfile(@CurrentAccount() user: RequestUser) {
    return this.accountsService.getProfile(user.accountId, user.sub);
  }

  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Updates the profile fields of the currently authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Patch('me')
  updateProfile(@CurrentAccount() user: RequestUser, @Body() dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.accountsService.updateProfile(user.accountId, user.sub, dto);
  }

  @ApiOperation({
    summary: 'Invite staff user',
    description:
      'Invites a new staff user to the account. Only the account owner can perform this action.',
  })
  @ApiResponse({ status: 201, description: 'User invited successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only owner can invite users.',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists in this account.',
  })
  @Post('invite')
  @Roles(UserRole.OWNER)
  invite(@CurrentAccount() user: RequestUser, @Body() dto: InviteUserDto) {
    return this.accountsService.inviteUser(user.accountId, dto);
  }
}
