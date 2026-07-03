# Task 2 Report — Common Layer

## What was implemented

- **`src/common/enums.ts`** — All shared enums copied verbatim from reference: AccountStatus, UserRole, LedgerReason, OrderStatus, CodStatus, OrderSourceChannel, RemittanceStatus, BillingInterval, SubscriptionStatus, SubscriptionInvoiceStatus, WhatsAppConversationStatus, WhatsAppMessageDirection
- **`src/common/guards/auth.guard.ts`** — JWT auth guard extending `@nestjs/passport` AuthGuard('jwt')
- **`src/common/guards/roles.guard.ts`** — Role-based access guard using Reflector metadata
- **`src/common/guards/subscription.guard.ts`** — Subscription status guard blocking mutating requests for suspended accounts
- **`src/common/decorators/current-account.decorator.ts`** — Param decorator to extract `request.user`
- **`src/common/decorators/roles.decorator.ts`** — Method decorator to set required roles metadata
- **`src/common/common.module.ts`** — Global module registering all guards as APP_GUARD providers

## Build results

`npx nest build` — **succeeded** (no output, zero errors)

## Files changed

| File | Action |
|------|--------|
| `src/app.module.ts` | modified — added CommonModule import |
| `src/common/enums.ts` | created |
| `src/common/guards/auth.guard.ts` | created |
| `src/common/guards/roles.guard.ts` | created |
| `src/common/guards/subscription.guard.ts` | created |
| `src/common/decorators/current-account.decorator.ts` | created |
| `src/common/decorators/roles.decorator.ts` | created |
| `src/common/common.module.ts` | created |

## Self-review findings

- All enums match reference file exactly
- Guards follow NestJS best practices (CanActivate interface, Reflector pattern)
- `ROLES_KEY` constant is exported from both `roles.guard.ts` and `roles.decorator.ts` — this is intentional as decorator and guard reference the same key
- CommonModule is `@Global()` so all modules can use guards/decorators without importing
- Guards are registered as `APP_GUARD` so they apply globally
- No test coverage yet (follows task 2 scope)

## Concerns

- None
