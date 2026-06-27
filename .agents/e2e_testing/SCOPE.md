# Scope: E2E Test Suite

## Architecture
- **Framework**: Vitest + jsdom + React Testing Library (to simulate frontend and server functions in TanStack Start)
- **Target Features**: Storefront Catalog (R1), AliExpress Importer Admin Panel (R2), Checkout and SQLite Store (R3), Modern Styling (R4)
- **Test File Layout**: `tests/e2e/`
- **Verification**: Test execution via `npm run test` or `npx vitest`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Test Infrastructure Setup | Configure test environment, write `TEST_INFRA.md` | None | DONE |
| M2 | Feature Coverage (Tier 1) | Implement Tier 1 tests: >=5 cases per feature | M1 | DONE |
| M3 | Boundary & Combinations (Tiers 2 & 3) | Implement Tier 2 (>=5 boundary cases per feature) and Tier 3 (pairwise combinations) tests | M2 | DONE |
| M4 | Real-World Scenarios (Tier 4) | Implement Tier 4 tests: >=5 complex user flows | M3 | DONE |
| M5 | Test Run & TEST_READY | Verify compilation/execution, publish `TEST_READY.md` | M4 | DONE |

## Interface Contracts
We test the following simulated interface boundaries from PROJECT.md:
- AliExpress mock client (`src/lib/aliexpress-mock.ts`)
- Pricing multiplier utilities (`src/lib/pricing.ts`)
- Local shopping cart state
- Simulated Checkout endpoints / DB order creation
- Modern Tailwind styling visual mode tokens
