import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    if (err || !user)
      throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}
