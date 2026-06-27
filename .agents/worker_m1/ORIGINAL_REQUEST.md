## 2026-06-21T14:18:11Z
You are the Worker for Milestone 1 (Database Schema & Importer Client).
Your working directory is `/data/data/com.termux/files/home/aliexpress-dropship/.agents/worker_m1/`.

Please read the Explorer's handoff report located at `/data/data/com.termux/files/home/aliexpress-dropship/.agents/explorer_m1/handoff.md` and `PROJECT.md` at the project root.

Your tasks are:
1. Implement the SQLite/Drizzle database schemas in `src/db/schema.ts`. Make sure to define:
   - Auth tables (`user`, `session`, `account`, `verification`) with `role` field on `user` table.
   - Storefront catalog tables (`products`, `product_options`, `product_variants`) with cascade deletes and custom markup field overrides (`customMarkupType` and `customMarkupValue`).
   - Orders schemas (`orders` and `order_items`).
   - Importer settings schema (`settings`) restricted to a single-row config.
2. Implement the pricing utility in `src/lib/pricing.ts` that handles fixed / multiplier pricing rules (storing cents to prevent rounding errors).
3. Implement the modular mock AliExpress client in `src/lib/aliexpress-mock.ts` with rich static products, deterministic product generator based on seed (using `@faker-js/faker`), and keyword search logic.
4. Configure `better-auth` in `src/lib/auth.ts` to use the Drizzle SQLite adapter pointing to Drizzle client.
5. Create `src/lib/__tests__/milestone1.test.ts` as suggested by the Explorer to verify the schemas, pricing rules, and mock AliExpress client.
6. Generate/run Drizzle migrations or push the schemas using `npx drizzle-kit generate` and `npx drizzle-kit push`.
7. Execute the tests using Vitest (`npx vitest run src/lib/__tests__/milestone1.test.ts`) and ensure all tests pass.
8. Document all implemented files and test output in your handoff report (`/data/data/com.termux/files/home/aliexpress-dropship/.agents/worker_m1/handoff.md`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
