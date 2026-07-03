# Task 6 Report: Customers + Orders Modules

**Commit:** `efa546b`
**Head:** `efa546b` (was `fc5b40d`)
**Build:** ✅ `npx nest build` — zero errors

## Changes

### Customers Module

- **`entities/customer.entity.ts`** — replaced stub with full entity (phone, name, address, RFM fields, RTO/delivered counters, relations to Account and Order)
- **`dto/create-customer.dto.ts`** — new: validates phone, name, governorate, district, streetAddress, optional landmark
- **`customers.service.ts`** — new: CRUD with `accountId` scoping, `NotFoundException` on missing
- **`customers.controller.ts`** — new: POST/GET/:id with `@CurrentAccount()` decorator
- **`customers.module.ts`** — updated from empty stub to register TypeORM entity + controller + service

### Orders Module

- **`entities/order.entity.ts`** — replaced stub with full entity (status, codStatus, financial fields, courier fields, sourceChannel, relations to Account/Customer/OrderItem/Invoice/InventoryLedger)
- **`entities/order-item.entity.ts`** — new: orderId, variantId, quantity, price (decimal)
- **`entities/invoice.entity.ts`** — new: orderId (1:1), invoiceNumber (INV-YYYYMMDD-XXXX), ETA fields
- **`dto/create-order.dto.ts`** — new: validates customerId, financials, courierProvider, nested items array
- **`orders.service.ts`** — new: atomic transaction via `DataSource.createQueryRunner()` — order creation, order items, `ORDER_RESERVATION` ledger entries, and invoice generation all in one transaction
- **`orders.controller.ts`** — new: POST/GET/:id with `@CurrentAccount()`
- **`orders.module.ts`** — updated from empty stub to register Order/OrderItem/Invoice/InventoryLedger entities + controller + service

### Cross-module fix

- **`products/entities/product-variant.entity.ts`** — added `orderItems` OneToMany relation (needed by OrderItem's ManyToOne)

## Deviations from Reference

- Removed `WhatsAppConversation` imports/relations from Customer and Order entities (module not built yet)
- Removed `CourierRemittanceLine` import/relation from Order entity (module not built yet)
- Changed `relations` syntax to TypeORM 1.0.0 object-style (`{ orderItems: true }` instead of `['orderItems']`)
- These will be added back when those respective modules are built

## Files Created (8)

| File                                               | Lines |
| -------------------------------------------------- | ----- |
| `src/modules/customers/dto/create-customer.dto.ts` | 11    |
| `src/modules/customers/customers.service.ts`       | 18    |
| `src/modules/customers/customers.controller.ts`    | 17    |
| `src/modules/orders/dto/create-order.dto.ts`       | 18    |
| `src/modules/orders/entities/order-item.entity.ts` | 29    |
| `src/modules/orders/entities/invoice.entity.ts`    | 41    |
| `src/modules/orders/orders.service.ts`             | 40    |
| `src/modules/orders/orders.controller.ts`          | 17    |

## Files Modified (5)

| File                                                      | Change                      |
| --------------------------------------------------------- | --------------------------- |
| `src/modules/customers/customers.module.ts`               | Stub → full module          |
| `src/modules/customers/entities/customer.entity.ts`       | Stub → full entity          |
| `src/modules/orders/orders.module.ts`                     | Stub → full module          |
| `src/modules/orders/entities/order.entity.ts`             | Stub → full entity          |
| `src/modules/products/entities/product-variant.entity.ts` | Added `orderItems` relation |
