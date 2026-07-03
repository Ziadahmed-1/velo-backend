import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/request-user.interface';

export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    return ctx.switchToHttp().getRequest<{ user: RequestUser }>().user;
  },
);
