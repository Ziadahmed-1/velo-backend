import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}
