# AliExpress Dropship Application Plan

## 1. Objectives & Scope
Build a TanStack Start e-commerce dropshipping application with:
1. **Storefront Catalog**: Listing grid, product search, details pages, options/variant selector, local cart.
2. **AliExpress Importer Admin Panel**: Access control via `better-auth`, mock AliExpress API client, keyword search / URL imports, setting custom multipliers / descriptions.
3. **Checkout & Database Store**: Checkout simulation, Drizzle ORM + SQLite database for products, orders, and importer settings.
4. **Modern Styling**: Tailwind CSS v4, dark/light responsive layout.

## 2. Architecture & Modules
- **Database (SQLite + Drizzle)**: Defines schemas for `products`, `orders`, `settings`, and `better-auth` tables.
- **AliExpress Mock Client**: Simulates AliExpress data fetch. Returns structured variations (e.g. size/color), raw price, description, images.
- **Admin Panel**: Import flows, product overrides, markup settings.
- **Storefront**: Local cart state, product search, detailed page with variant selector and final pricing calculation.
- **Checkout**: Form capturing name, address, mock payment, persisting orders to SQLite.

## 3. Implementation Milestones
- **M1: Database Schema & Importer Client**: Set up Drizzle tables, SQLite connection, configure `better-auth` with SQLite/Drizzle adapter, create mock AliExpress client.
- **M2: Storefront Catalog & Cart**: Build storefront routes, grid list, detail pages, variant selectors, and persistent shopping cart.
- **M3: Importer Admin Panel**: Build secure admin dashboard, integrate URL/search importer, settings management for markup rules.
- **M4: Checkout & Order Store**: Checkout form, simulated payment, order creation, order listing.
- **M5: Integration, Tests, E2E Testing & Hardening**: Run unit tests, verify end-to-end user flows, add adversarial tests.

## 4. Verification Strategy
- Write unit tests for product price calculations and importing client in Vitest.
- Run complete E2E flows using TanStack Start routes.
- Confirm database state persistence using Drizzle Studio or direct verification scripts.
