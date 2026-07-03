import { Controller, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRole } from '../../common/enums';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}
  @Post('invite')
  @Roles(UserRole.OWNER)
  invite(@CurrentAccount() user: RequestUser, @Body() dto: InviteUserDto) {
    return this.accountsService.inviteUser(user.accountId, dto);
  }
}
