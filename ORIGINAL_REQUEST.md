# Original User Request

## Initial Request — 2026-06-21T14:13:29Z

An e-commerce dropshipping application built on the existing TanStack Start workspace, using SQLite (better-sqlite3) with Drizzle ORM, better-auth, and Tailwind CSS v4. The app features a customer storefront, a shopping cart, and a secure admin dashboard to import products using a mock AliExpress API.

Working directory: `/data/data/com.termux/files/home/aliexpress-dropship`
Integrity mode: development

## Requirements

### R1. Storefront Catalog
- Display product listing grid, product search, and detail pages.
- Support products with options (e.g. variations for size/color) and dynamically display variant pricing.
- Persistent local shopping cart (add/remove items, update quantities, calculate totals).

### R2. AliExpress Importer Admin Panel
- Access-controlled admin panel using the pre-installed `better-auth` library.
- Direct URL product import from AliExpress or AliExpress keyword search.
- Product edit panel (set custom markup multipliers, override descriptions, images, tags).

### R3. Checkout and SQLite Store
- Simulation of checkout flow (capturing name, shipping address, and mock Stripe checkout).
- Drizzle ORM with SQLite database to store synced products, orders, and importer settings.

### R4. Modern Styling
- Styled with Tailwind CSS v4.
- High-fidelity dark/light mode responsive layout.

## Acceptance Criteria

### E-commerce & Importer Flow
- [ ] Product details successfully imported from a modular AliExpress mock client.
- [ ] Pricing calculations apply rules (margin percentage or fixed markup) saved in settings.
- [ ] Cart updates totals dynamically and allows selection of variations.
- [ ] Order generation stores order records in the SQLite database.
- [ ] Validated with test files verifying product import and price calculations.
