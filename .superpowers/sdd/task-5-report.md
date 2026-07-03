# Task 5 Report — Inventory Module (Append-Only Ledger)

## What I Implemented

- **Entity**: `InventoryLedger` — append-only ledger with variant, quantity, reason, optional order/auditNote references
- **DTO**: `AdjustStockDto` — variantId, quantity, reason, optional auditNote with class-validator
- **Service**: `InventoryService` — `getStock(variantId)` returns `{ variantId, currentStock }` using `SUM(quantity)` via QueryBuilder; `adjust(accountId, dto)` validates variant belongs to account, creates ledger entry
- **Controller**: `InventoryController` — `GET variants/:variantId/stock`, `POST adjust`
- **Module**: `InventoryModule` — registers TypeORM entities (InventoryLedger, ProductVariant), controller, service
- **Restored relation**: Added `ledgerEntries: InventoryLedger[]` OneToMany back to `ProductVariant` entity (was pruned in Task 4)
- **Added inverse relation**: Added `inventoryLedgerEntries` OneToMany to `Order` entity (required by InventoryLedger's ManyToOne)

## Test Results

```
PASS  tests/unit/inventory.service.spec.ts (3 tests)
  ✓ should return current stock for a variant
  ✓ should add a ledger entry on stock adjust
  ✓ should throw if variant not found for the account

PASS  tests/unit/auth.service.spec.ts (4 tests)

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

## Build Results

`npx nest build` — SUCCESS (0 errors)

## Files Changed

| File | Status |
|------|--------|
| `src/modules/inventory/entities/inventory-ledger.entity.ts` | Created |
| `src/modules/inventory/dto/adjust-stock.dto.ts` | Created |
| `src/modules/inventory/inventory.service.ts` | Created |
| `src/modules/inventory/inventory.controller.ts` | Created |
| `src/modules/inventory/inventory.module.ts` | Replaced stub |
| `tests/unit/inventory.service.spec.ts` | Created |
| `src/modules/products/entities/product-variant.entity.ts` | Modified — restored `ledgerEntries` relation |
| `src/modules/orders/entities/order.entity.ts` | Modified — added `inventoryLedgerEntries` inverse relation |

## Self-Review Findings

1. **TDD followed**: Wrote tests first (red), implemented source (green), refactored to match brief exactly.
2. **Cross-module relation restored**: `ProductVariant.ledgerEntries` with `InventoryLedger` — exactly matches reference.
3. **Order entity updated**: Added minimal `inventoryLedgerEntries` inverse side so TypeORM doesn't throw on `InventoryLedger.order` relation.
4. **Append-only pattern**: No update/delete endpoints — stock is always `SUM(quantity)`, preventing race conditions during concurrent decrements.

## Concerns

- None. Build is clean, tests pass, commit is scoped.
