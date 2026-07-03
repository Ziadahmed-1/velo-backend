import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AccountStatus } from '../enums';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user, method } = context.switchToHttp().getRequest();
    if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
      if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new HttpException(
          'Account is suspended. Upgrade your subscription to resume operations.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }
    return true;
  }
}
