### Task 2: Common Layer — Enums, Decorators, Guards

**Files:**

- Create: `src/common/enums.ts`
- Create: `src/common/guards/auth.guard.ts`
- Create: `src/common/guards/roles.guard.ts`
- Create: `src/common/guards/subscription.guard.ts`
- Create: `src/common/decorators/current-account.decorator.ts`
- Create: `src/common/decorators/roles.decorator.ts`

- [ ] **Step 1: Copy enums from reference**

Copy `velo-full-reference/src/common/enums.ts` to `src/common/enums.ts`

- [ ] **Step 2: Create AuthGuard**

`src/common/guards/auth.guard.ts`:

```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user)
      throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}
```

- [ ] **Step 3: Create RolesGuard**

`src/common/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

- [ ] **Step 4: Create SubscriptionGuard**

`src/common/guards/subscription.guard.ts`:

```typescript
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
```

- [ ] **Step 5: Create decorators**

`src/common/decorators/current-account.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

`src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 6: Create CommonModule**

`src/common/common.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

@Global()
@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
  ],
})
export class CommonModule {}
```

- [ ] **Step 7: Verify build**

```bash
npx nest build
```

---
