# Project: AliExpress Dropship E-commerce Application

## Architecture
This project is built using:
- **Framework**: TanStack Start (React Router + Vite + Server Functions)
- **Database**: SQLite (via `better-sqlite3`) managed through **Drizzle ORM**
- **Authentication**: `better-auth` using SQLite/Drizzle schema storage
- **Styling**: Tailwind CSS v4 for responsive, accessible dark/light mode interfaces
- **Mock Client**: A modular mock AliExpress client mimicking product fetching by keyword/URL

```
┌──────────────────────────────────────────────────────────────┐
│                      Customer Storefront                     │
│    ┌──────────────┐   ┌──────────────┐   ┌───────────────┐   │
│    │ Catalog Grid │──&gt;│ Product Page │──&gt;│ Shopping Cart │   │
│    └──────────────┘   └──────────────┘   └───────────────┘   │
└───────────────────────────────┬──────────────────────────────┘
                                │ (read products / create orders)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    SQLite Database (Drizzle)                 │
│    ┌──────────┐    ┌─────────┐    ┌──────────┐   ┌─────────┐ │
│    │ Products │    │ Orders  │    │ Settings │   │ Auth DB │ │
│    └──────────┘    └─────────┘    └──────────┘   └─────────┘ │
└───────────────────────────────▲──────────────────────────────┘
                                │ (write products & settings)
                                │
┌──────────────────────────────────────────────────────────────┐
│                  AliExpress Importer Admin                   │
│   ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│   │ Import Panel │──&gt;│ Product Edit │──&gt;│ Markup Settings │  │
│   └──────────────┘   └──────────────┘   └─────────────────┘  │
│          │                                                   │
│          ▼ (fetch)                                           │
│   ┌─────────────────────────────┐                            │
│   │ AliExpress Mock API Client  │                            │
│   └─────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────┘
```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Database & Importer Mock | Create Drizzle schemas (including better-auth), SQLite integration, and mock AliExpress client | None | DONE |
| M2 | Storefront Catalog & Cart | Product grids, search, product detail pages with variant pricing, local shopping cart | M1 | DONE |
| M3 | Importer Admin Panel | Access-controlled admin route, URL/keyword search import UI, product editing, settings | M1 | DONE |
| M4 | Checkout & Order Store | Checkout flow simulation, mock Stripe dialog, order storage, customer confirmation | M2, M3 | DONE |
| M5 | Adversarial Hardening | Unit & E2E verification, robust pricing validations, Tier 5 testing | M4 | DONE |

## Interface Contracts
### AliExpress Mock API Client
```typescript
interface AliExpressProductOption {
  name: string; // e.g. "Color", "Size"
  values: string[]; // e.g. ["Red", "Blue"], ["S", "M", "L"]
}

interface AliExpressVariant {
  sku: string;
  combination: Record<string, string>; // e.g. { "Color": "Red", "Size": "M" }
  price: number; // raw price in USD
  inventory: number;
}

interface AliExpressProduct {
  id: string;
  title: string;
  description: string;
  rawPrice: number; // standard/base raw price
  imageUrl: string;
  additionalImages: string[];
  options: AliExpressProductOption[];
  variants: AliExpressVariant[];
  tags: string[];
  sourceUrl: string;
}
```

### Pricing Formula Settings
```typescript
interface MarkupSettings {
  markupType: 'fixed' | 'multiplier';
  fixedMarkup: number; // e.g. 5.00 for $5 extra
  marginMultiplier: number; // e.g. 1.5 for 50% margin markup
}
```

## Code Layout
- `src/db/schema.ts` - Drizzle tables for products, orders, settings, and auth tables
- `src/db/index.ts` - Database connection and Drizzle client initialization
- `src/lib/aliexpress-mock.ts` - Modular AliExpress mock service
- `src/lib/pricing.ts` - Price calculation utilities applying settings rules
- `src/lib/auth.ts` - `better-auth` configuration with SQLite/Drizzle adapter
- `src/components/` - Common UI elements (Cart, ProductCard, etc.)
- `src/routes/` - TanStack Start routes:
  - `/` - Storefront homepage/listing
  - `/products/$id` - Product details with option/variant selector
  - `/cart` - Local shopping cart page
  - `/checkout` - Customer checkout and payment simulation page
  - `/admin/login` - Administrator login page
  - `/admin/importer` - Admin panel for AliExpress product search and URL imports
  - `/admin/products` - Admin product listings and custom multiplier overrides
  - `/admin/settings` - Admin markup and profit rules settings page
