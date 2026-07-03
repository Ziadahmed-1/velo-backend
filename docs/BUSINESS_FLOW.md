# Velo — Business Flow Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  (NestJS — REST JSON on port 3000, Swagger at /docs)       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │ WhatsApp │  │ Paste-  │  │ Courier │  │   Billing    │  │
│  │ (360dialog│  │ Parse   │  │ (Bosta/ │  │ (Paymob stub)│  │
│  │ webhook) │  │ (LLM)   │  │ Mylerz) │  │              │  │
│  └────┬─────┘  └────┬────┘  └────┬────┘  └──────┬───────┘  │
│       │              │            │               │          │
│  ┌────▼──────────────▼────────────▼───────────────▼───────┐  │
│  │                    Core Modules                         │  │
│  │  Accounts │ Products │ Inventory │ Customers │ Orders  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Background Jobs (BullMQ)                   │  │
│  │  RFM │ Overage │ Suspension │ Remittance               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │             External Integrations                       │  │
│  │  360dialog API  │  Bosta API  │  Mylerz API  │ Paymob │  │
│  │  (WhatsApp BSP) │  (Courier)  │  (Courier)   │ (Stub) │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                            │
│  PostgreSQL 16 + Redis 7 (BullMQ job queue)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Module-by-Module Guide

### 1. Authentication & Accounts

**Purpose:** Merchant signup/login, user management.

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | Public | Register new business + owner user |
| POST | /auth/login | Public | Login, returns JWT |
| GET | /accounts/me | JWT | Get current user profile |
| PATCH | /accounts/me | JWT | Update profile |
| POST | /accounts/invite | JWT+Admin | Invite staff user |

**Flow:**
1. Merchant registers at `/auth/register` → creates Account + User (role: OWNER)
2. Returns JWT with `{ sub: userId, accountId, role }`
3. All subsequent requests include `Authorization: Bearer <token>`
4. OWNER can invite STAFF users via `/accounts/invite`

**JWT payload:**
```json
{ "sub": "user-uuid", "accountId": "account-uuid", "role": "OWNER" }
```

---

### 2. Products

**Purpose:** Catalog management — products, variants with attributes.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List all products with variants + attributes |
| POST | /products | Create product |
| GET | /products/:id | Get product detail |
| POST | /products/:id/variants | Add variant under product |
| GET | /products/suggestions | List item suggestions (unmatched LLM items) |
| PATCH | /products/suggestions/:id/dismiss | Dismiss suggestion |
| POST | /products/suggestions/:id/create-variant | Convert suggestion → variant |

**Key entity: `ProductVariant`**
- `sku` — unique per account (e.g., `CHAI-1KG`)
- `price` / `costPrice` — decimal strings, never JS numbers
- `attributesJson` — denormalized attributes as JSONB with GIN index (e.g., `{"Size": "1KG", "Flavor": "Original"}`). This avoids complex attribute-join queries at read time.

**Suggested Items:**
When a customer asks for something not in the catalog, the LLM creates a `SuggestedItem` with `rawName` and `timesMentioned` (auto-incremented). The merchant can:
1. View all suggestions sorted by popularity
2. Dismiss irrelevant ones
3. One-tap create a variant from a suggestion (picks a product, provides SKU + price)

---

### 3. Inventory

**Purpose:** Append-only stock ledger. Every stock movement is a row — never mutated.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /inventory/variants/:variantId/stock | Get current stock (SUM of ledger) |
| POST | /inventory/adjust | Add ledger entry (positive = in, negative = out) |

**Ledger reasons:** `INITIAL_RESTOCK`, `MANUAL_ADJUSTMENT`, `ORDER_RESERVATION`, `RETURN`, `DAMAGE`

**Flow:**
- On order creation (`POST /orders`), negative entries are automatically created for each item (`ORDER_RESERVATION`)
- Merchant can manually adjust via `POST /inventory/adjust`
- Current stock is always `SUM(quantity)` — never stored as a balance

---

### 4. Customers

**Purpose:** Customer directory.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /customers | Create customer |
| GET | /customers | List all (sorted by newest) |
| GET | /customers/:id | Get customer detail |

**Fields:** phone, name, governorate, district, streetAddress, landmark

**Auto-creation:** When a WhatsApp message or paste-parse text includes a customer phone, the system finds or creates the customer automatically.

---

### 5. Orders

**Purpose:** Order lifecycle — creation, confirmation, tracking.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /orders | Create order manually with items + stock reservation |
| GET | /orders | List all orders with items, customer, invoice |
| GET | /orders/:id | Get order detail |
| PATCH | /orders/:id/confirm | Confirm draft → enqueues RFM job |

**Key fields:**
- `isDraft` (boolean) — orders start as draft, confirmed manually
- `sourceChannel` — how the order was created: `MANUAL`, `PASTE_PARSE`, `WHATSAPP`
- `courierProvider` — which courier to use (`bosta` or `mylerz`)
- `conversationContext` (JSONB) — raw LLM extraction + match results (for audit)

**Atomic creation flow:**
1. Validates customer exists
2. Creates Order + OrderItems in transaction
3. Creates InventoryLedger entries (negative) for each item = stock reservation
4. Creates Invoice with generated invoice number

**Confirm flow:**
1. Sets `isDraft = false`
2. Enqueues an RFM job (pending: real notification logic)

---

### 6. Paste-Parse (LLM Extraction)

**Purpose:** Convert natural language text → structured draft order. Two OpenRouter LLM calls.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /paste-parse | Parse text, extract items, match catalog, create draft order |

**Full pipeline:**
```
Raw text → [LLM Call 1: ExtractionService] → Structured order data
    ↓
Structured data → [LLM Call 2: CatalogMatcherService] → Matched items + alternatives
    ↓
Matched results → [PasteParseService] → Create/update Customer + draft Order + OrderItems + SuggestedItem upserts
```

**Example input:**
```
"Hello, I need 2 kilos of Chai mix, 1 kilo of Lemon mint, and also 3 packs of ginger.
My name is Ahmed, 01012345678, delivery to 15 Tahrir street, downtown Cairo"
```

**LLM Call 1** extracts: customer name, phone, address, items with quantities, totals.
**LLM Call 2** matches each item against merchant's catalog:
- `HIGH_CONFIDENCE` — exact match found
- `AMBIGUOUS` — partial match, suggests alternatives
- `NO_MATCH` — creates/upserts SuggestedItem

Model: `meta-llama/llama-3.1-70b-instruct` via OpenRouter.

---

### 7. WhatsApp (360dialog)

**Purpose:** Two-way WhatsApp communication via 360dialog Business API.

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /whatsapp/webhook | Public | 360dialog verification |
| POST | /whatsapp/webhook | Public | Incoming message webhook |
| POST | /whatsapp/send | JWT | Send text message |
| GET | /whatsapp/conversations | JWT | List conversations |
| GET | /whatsapp/conversations/:id/messages | JWT | Get messages |
| GET | /whatsapp/templates | JWT | List templates |
| POST | /whatsapp/templates/sync | JWT | Sync templates from 360dialog |

**Webhook flow:**
```
360dialog → POST /whatsapp/webhook → WhatsAppWebhookController (public)
    ↓
WhatsAppService.handleIncoming()
    ↓
1. Find WhatsAppAccount by bspChannelId
2. Find or create WhatsAppConversation (OPEN status)
3. Save inbound WhatsAppMessage
4. Call MessageToOrderService.process(text)
    ↓
MessageToOrderService → PasteParseService.parse(accountId, text)
    ↓
Creates draft Order + links to conversation
    ↓
Conversation status → DRAFT_ORDER_CREATED
    ↓
Send confirmation text back to customer
```

**Conversation states:** `OPEN` → `DRAFT_ORDER_CREATED` → `CLOSED`

---

### 8. Courier (Bosta / Mylerz)

**Purpose:** Shipment creation, tracking, and remittance reconciliation. Uses Strategy pattern via `CourierProvider` interface.

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /courier/shipments | JWT | Create shipment with order's courier provider |
| GET | /courier/webhook/bosta | Public | Bosta webhook |
| POST | /courier/webhook/bosta | Public | Bosta webhook receiver |
| GET | /courier/webhook/mylerz | Public | Mylerz webhook |
| POST | /courier/webhook/mylerz | Public | Mylerz webhook receiver |
| GET | /courier/remittances | JWT | List remittance batches |
| GET | /courier/remittances/:id | JWT | Get remittance detail |
| POST | /courier/remittances/:id/reconcile | JWT | Reconcile remittance |

**Provider Interface:**
```typescript
interface CourierProvider {
  createShipment(order, customer): Promise<{ trackingNumber, labelUrl }>
  trackShipment(trackingNumber): Promise<CourierTrackingStatus>
  cancelShipment(trackingNumber): Promise<void>
  getProviderName(): string
}
```

**Shipment flow:**
1. Merchant confirms order (sets courierProvider)
2. `POST /courier/shipments` with orderId
3. CourierService loads Order + Customer
4. Selects provider based on `order.courierProvider` (`bosta` or `mylerz`)
5. Calls provider's API → saves tracking number
6. Webhooks update delivery status (DELIVERED, RETURNED, etc.)

**Remittance:**
Courier companies send remittance reports (batches of COD payments). The system:
1. Stores remittance with lines (orderId, expectedAmount)
2. Merchant receives actual amounts from courier
3. `reconcile` compares expected vs received → marks SETTLED or PARTIAL

---

### 9. Billing

**Purpose:** Subscription plans, usage metering, invoicing, payment (stubbed).

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /billing/plans | Admin | Create plan |
| GET | /billing/plans | Public | List active plans |
| GET | /billing/plans/:id | Public | Get plan |
| POST | /billing/subscriptions | JWT | Create subscription (auto-trial) |
| GET | /billing/subscriptions/current | JWT | Get current subscription |
| PATCH | /billing/subscriptions/change-plan | JWT | Change plan |
| GET | /billing/invoices | JWT | List invoices |
| POST | /billing/payments/create | JWT | Create payment (stub) |
| POST | /billing/payments/webhook | Public | Paymob webhook (stub) |
| POST | /billing/overage/calculate | JWT | Calculate overage |

**Default plans (seeded by migration):**

| Name | Included Orders | Price (EGP/mo) | Overage per Order |
|------|----------------|----------------|-------------------|
| Trial | 50 | 0 | 5 EGP |
| Starter | 250 | 999 | 4 EGP |
| Pro | 1000 | 2499 | 3 EGP |

**Overage calculation:**
```typescript
const orderCount = count confirmed orders in current billing period
const included = plan.includedOrdersPerPeriod
const overageOrders = max(0, orderCount - included)
const overageAmount = overageOrders * plan.overagePricePerOrderEgp
```

**Invoice generation:**
```typescript
total = plan.basePriceEgp + overageAmount
// Creates SubscriptionInvoice with status DRAFT
```

---

### 10. BullMQ Queues

**Purpose:** Background job processing via Redis-backed queues.

| Queue | Processor | Trigger | Future Behavior |
|-------|-----------|---------|-----------------|
| rfm | RfmProcessor | Order confirmed | Notify merchant of ready order |
| overage | OverageProcessor | Scheduled | Check overage, create invoice |
| suspension | SuspensionProcessor | Scheduled | Suspend past-due accounts |
| remittance | RemittanceProcessor | Manual/scheduled | Reconcile courier remittances |

**Currently:** All processors are stubs (log only). Redis must be running.

---

## Complete Order Lifecycle

```
1. Customer sends WhatsApp message
   ↓
2. 360dialog → POST /whatsapp/webhook
   ↓
3. MessageToOrderService → PasteParseService.parse()
   ├── LLM Call 1: Extract structured data (customer, items, address)
   ├── LLM Call 2: Match items against catalog
   └── Creates draft Order with suggested items
   ↓
4. Merchant reviews draft Order
   ├── Check suggested items → create variants if needed
   ├── Adjust quantities/prices
   └── PATCH /orders/:id/confirm
   ↓
5. Order confirmed (isDraft = false)
   ├── Enqueues RFM job (placeholder)
   └── Merchant chooses courier
   ↓
6. POST /courier/shipments
   ├── Calls Bosta or Mylerz API
   ├── Saves tracking number on Order
   └── Returns label URL
   ↓
7. Courier delivers → sends webhook
   ├── POST /courier/webhook/bosta
   └── Order status → DELIVERED
   ↓
8. Courier sends remittance report
   ├── System stores remittance batch
   └── Merchant reconciles: POST /courier/remittances/:id/reconcile
   ↓
9. Billing: Overage counts confirmed orders
   ├── At period end → invoice with overage
   └── Payment via Paymob (stubbed)
```

---

## Placeholder / Stubbed Components

These are implemented but return mock/placeholder data:

| Component | Status | What's Missing |
|-----------|--------|----------------|
| **PaymobService** | 🟡 Stubbed | Returns mock payment URL. Replace with real Paymob Accept API integration when credentials arrive. |
| **RfmProcessor** | 🟡 Log-only | Should send notification (email/push) to merchant when order is ready for review. |
| **OverageProcessor** | 🟡 Log-only | Should call OverageService.calculate() + InvoicesService.createInvoice() on schedule. |
| **SuspensionProcessor** | 🟡 Log-only | Should check PAST_DUE subscriptions past grace period → mark account SUSPENDED. |
| **RemittanceProcessor** | 🟡 Log-only | Should call RemittanceService.reconcile() for pending remittances. |
| **WhatsApp template sync** | 🟡 Basic | Syncs from 360dialog but no template send endpoint for rich messages (buttons, lists). |

---

## Remaining Roadmap

### Short-term (before production)

1. **Real Paymob integration** — Replace stub with actual Paymob Accept API for payment processing
2. **Queue processors** — Implement real logic in RFM, Overage, Suspension, Remittance processors
3. **BullMQ repeatable jobs** — Schedule overage/suspension checks via `QueueScheduler` or cron
4. **Email/push notifications** — Merchant email alerts for new drafts, confirmations

### Medium-term

5. **WhatsApp rich messaging** — Template messages with buttons, quick replies, lists
6. **Analytics dashboard** endpoints — Dashboard stats (orders/period, revenue, top items)
7. **Multi-provider courier support** — Additional couriers (e.g., Aramex, DHL)
8. **Order status webhooks** — Webhook for merchant's own systems to track order lifecycle

### Long-term

9. **Frontend** — Merchant dashboard (React/Vue/Next.js) per FRONTEND_UI_SPEC.md
10. **Mobile app** — Customer tracking, push notifications
11. **Multi-language** — LLM prompts in Arabic/English, customer UI
12. **Advanced inventory** — Batch tracking, expiry dates, warehouse management

---

## How to Interact

### Quick Start

```bash
# 1. Register merchant
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"businessName":"My Shop","email":"owner@myshop.com","password":"secure123"}'

# Response includes JWT — save as TOKEN

# 2. Create a product
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Beverages"}'

# 3. Add a variant
curl -X POST http://localhost:3000/products/PRODUCT_ID/variants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"CHAI-1KG","price":150,"costPrice":100}'

# 4. Test paste-parse
curl -X POST http://localhost:3000/paste-parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"I need 2 Chai mix, Ahmed, 01012345678, Cairo"}'

# 5. Confirm the draft order
curl -X PATCH http://localhost:3000/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courierProvider":"bosta"}'

# 6. Create shipment
curl -X POST http://localhost:3000/courier/shipments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID"}'

# 7. View Swagger docs at http://localhost:3000/docs
```

### Key Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=velo

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct

# WhatsApp (360dialog)
WHATSAPP_VERIFY_TOKEN=velo-verify-token

# Courier - Bosta
BOSTA_API_KEY=
BOSTA_BASE_URL=https://app.bosta.co/api/v2

# Courier - Mylerz
MYLERZ_API_KEY=
MYLERZ_BASE_URL=https://api.mylerz.net/v1

# Billing / Paymob (stubbed)
PAYMOB_API_KEY=
PAYMOB_HMAC_SECRET=
DEFAULT_CURRENCY=EGP
```
