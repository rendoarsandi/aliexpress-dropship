# E2E Test Suite Plan - Tier 3 & Tier 4 (Explorer 2 Findings)

## 1. Observation

Based on our analysis of `/data/data/com.termux/files/home/aliexpress-dropship/ORIGINAL_REQUEST.md`, `/data/data/com.termux/files/home/aliexpress-dropship/PROJECT.md`, and the current state of the workspace:
1. **Framework & Dependencies**: The workspace uses TanStack Start, React 19, SQLite via `better-sqlite3`, Drizzle ORM, `better-auth` for authentication, and Tailwind CSS v4 for styling. 
2. **Current Testing Capabilities**: In `package.json`, Vitest (`"vitest": "^4.1.5"`) and JSDOM (`"jsdom": "^28.1.0"`) are installed. A test script `"test": "vitest run"` is defined. However, no test files exist in the codebase.
3. **Database Integration**: `src/db/schema.ts` currently contains only a placeholder `todos` table. The handoff from `explorer_m1` proposes a complete relational SQLite schema including tables for `user`, `session`, `account`, `verification`, `products`, `product_options`, `product_variants`, `orders`, `order_items`, and `settings`.
4. **Mock Integrations**: The application relies on a modular AliExpress mock client (`src/lib/aliexpress-mock.ts`) that parses product IDs and uses deterministically seeded `@faker-js/faker` to generate mock data. Pricing markup settings are managed in a single-row `settings` table and calculated via `src/lib/pricing.ts`.

---

## 2. Logic Chain

1. **Opaque-Box E2E Testing**: E2E tests must treat the application as a black box, verifying requirements through the user interface (rendered DOM elements, forms, checkout interactions) and asserting side-effects directly in the database (SQLite persistence) or web API state (mock Stripe, auth sessions).
2. **Robust Multi-Feature Combinations (Tier 3)**:
   - To verify correct cross-feature integration, we must test how configurations made in the Admin panel (R2) propagate through the Storefront Catalog (R1), Checkout engine (R3), and Styling layout (R4).
   - By identifying the key variables (Factor A: Importer Markup Rule Config, Factor B: Storefront Catalog Selection, Factor C: Checkout Result, Factor D: Theme Viewport Styling) and their respective levels, we can construct a **pairwise coverage matrix**. This guarantees that all pairs of system settings are tested in combination at least once, optimizing the test suite size to 9 highly targeted cases instead of 36 full-factorial tests.
3. **Real-World Scenarios (Tier 4)**:
   - Storefront checkout is not isolated; users refresh pages, administrators modify inventory/pricing in parallel, and unauthorized guests try to bypass forms.
   - We design 5 comprehensive, sequential scenarios (Happy Path, Stale Price Prevention, Cart Persistence with Deleted Product, Multi-Item Bulk Checkout, and Security Gate Sanitization) to ensure the system is resilient under realistic, asynchronous conditions.
4. **Testing Harness in TanStack Start**:
   - Rather than relying on separate heavyweight browser integrations (which can be flaky or slow in development), we can configure Vitest with a `jsdom` environment.
   - Using an in-memory SQLite database (`:memory:`) populated on-the-fly with the real Drizzle schema ensures that database assertions are fast, safe, and isolated. 
   - Mocking cookies and network fetch enables full E2E simulation of `better-auth` login and Stripe checkouts.

---

## 3. Caveats

1. **JSDOM Viewport Restrictions**: JSDOM does not perform actual layout rendering. Viewport testing (Desktop vs. Mobile) is verified by asserting the presence of responsive Tailwind v4 classes (e.g., checking if mobile-only elements have `block md:hidden` or cart headers are hidden via class assertions) rather than pixel layout heights/widths.
2. **Better-Auth Session Mocking**: In JSDOM, `better-auth` requires mocking cookies or API endpoint handlers on the test runner context, as there is no real browser cookie jar. The setup must pre-populate session records directly in the SQLite database and mock headers.
3. **Stripe Dialog Hook**: The Stripe checkout flow is a simulated dialog. E2E tests must intercept the window or global event triggers that would launch the checkout frame, simulating clicks on the success/cancel buttons programmatically.

---

## 4. Conclusion: Test Suite Plan

### 4.1 Tier 3: Cross-Feature Combinations (Pairwise Test Matrix)

The test matrix below varies four factors:
* **Factor A: Admin Markup Config**: Multiplier (`A1`), Fixed (`A2`), Product Overrides (`A3`).
* **Factor B: Catalog/Cart Selection**: Single Variant (`B1`), Multi-Variant (`B2`), Mixed Products (`B3`).
* **Factor C: Checkout result**: Success (`C1`), Cancelled/Failed (`C2`).
* **Factor D: Styling Viewport**: Light/Desktop (`D1`), Dark/Mobile (`D2`).

| Test Case ID | Factor A (Admin Configuration) | Factor B (Catalog/Cart Selection) | Factor C (Checkout Flow) | Factor D (Styling / Viewport) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-3.1** | A1 (Global Multiplier 1.5x) | B1 (Single option variant) | C1 (Successful Checkout) | D1 (Light Mode / Desktop) |
| **TC-3.2** | A1 (Global Multiplier 1.5x) | B2 (Multi-variant same-product)| C2 (Cancelled/Failed Checkout) | D2 (Dark Mode / Mobile) |
| **TC-3.3** | A1 (Global Multiplier 1.5x) | B3 (Mixed items/multi-product) | C1 (Successful Checkout) | D2 (Dark Mode / Desktop) |
| **TC-3.4** | A2 (Global Fixed +$10.00) | B1 (Single option variant) | C2 (Cancelled/Failed Checkout) | D2 (Dark Mode / Mobile) |
| **TC-3.5** | A2 (Global Fixed +$10.00) | B2 (Multi-variant same-product)| C1 (Successful Checkout) | D1 (Light Mode / Mobile) |
| **TC-3.6** | A2 (Global Fixed +$10.00) | B3 (Mixed items/multi-product) | C2 (Cancelled/Failed Checkout) | D1 (Light Mode / Desktop) |
| **TC-3.7** | A3 (Product Custom Override) | B1 (Single option variant) | C1 (Successful Checkout) | D2 (Dark Mode / Mobile) |
| **TC-3.8** | A3 (Product Custom Override) | B2 (Multi-variant same-product)| C1 (Successful Checkout) | D1 (Light Mode / Desktop) |
| **TC-3.9** | A3 (Product Custom Override) | B3 (Mixed items/multi-product) | C2 (Cancelled/Failed Checkout) | D1 (Light Mode / Mobile) |

#### Pairwise Test Case Specifications

##### TC-3.1: Global Multiplier Success (A1 + B1 + C1 + D1)
* **Objective**: Verify that global multiplier rules apply correctly to a single-variant cart, and checkout completes successfully in desktop light mode, creating correct database records.
* **Preconditions**: SQLite DB settings table is seeded with `markupType = 'multiplier'`, `marginMultiplier = 1.5`. Product with base price $10.00 (1000 cents) is imported.
* **Execution Steps**:
  1. Render storefront home component in Light Mode and Desktop Viewport.
  2. Search for the imported product and click on it.
  3. Verify variant price displays as `$15.00` in the UI.
  4. Select variant, add to cart. Navigate to `/cart`.
  5. Click "Proceed to Checkout", fill out name & address.
  6. Trigger simulated Stripe popup and click "Success".
* **Verifications**:
  1. Verify DOM contains Light Mode layout styling (e.g. absence of `dark` class on root elements).
  2. Verify SQLite DB `orders` table contains 1 record with `totalAmount = 1500` cents, `status = 'paid'`, and correct shipping details.
  3. Verify `order_items` table contains 1 entry linked to the product variant.

##### TC-3.2: Multi-Variant Checkout Cancellation (A1 + B2 + C2 + D2)
* **Objective**: Verify adding multiple variants of the same product under global multiplier configuration, and that checkout cancellation in mobile dark mode leaves cart contents intact and DB orders empty.
* **Preconditions**: SQLite settings set to 1.5x multiplier. Product imported with raw variants: Var A (raw $20.00 -> retail $30.00), Var B (raw $25.00 -> retail $37.50).
* **Execution Steps**:
  1. Render product detail route under Dark Mode with Mobile Viewport.
  2. Select Var A, set quantity to 2, click "Add to Cart".
  3. Select Var B, set quantity to 1, click "Add to Cart".
  4. Navigate to `/cart`. Verify cart total displays `$97.50` (`2 * $30.00 + 1 * $37.50`).
  5. Proceed to checkout, trigger Stripe mockup, select "Cancel".
* **Verifications**:
  1. Verify `dark` class is applied to the root element.
  2. Verify mobile collapse navigation elements are visible.
  3. Verify storefront shopping cart still contains the 3 items.
  4. Verify SQLite DB `orders` table is empty.

##### TC-3.3: Mixed Items Multi-Product Checkout (A1 + B3 + C1 + D2)
* **Objective**: Verify mixed cart containing different products checkouts successfully under desktop dark mode.
* **Preconditions**: Settings set to 1.5x multiplier. Product A (base $10.00 -> retail $15.00), Product B (base $20.00 -> retail $30.00).
* **Execution Steps**:
  1. Set viewport to Desktop, Dark Mode.
  2. Add 1x Product A variant and 2x Product B variants to cart.
  3. Navigate to checkout, complete Stripe checkout successfully.
* **Verifications**:
  1. Verify cart displays totals correctly for multiple products.
  2. Verify SQLite DB `orders` table has 1 record with `totalAmount = 7500` cents.
  3. Verify `order_items` table contains 2 distinct rows linked to the correct products.

##### TC-3.4: Global Fixed Markup Cancellation (A2 + B1 + C2 + D2)
* **Objective**: Verify storefront applies global fixed markup (+$10.00) to a single-variant cart, and checkout failure under mobile dark mode preserves cart.
* **Preconditions**: Settings table configured with `markupType = 'fixed'`, `fixedMarkup = 1000` (cents). Product imported with raw variant price $15.00.
* **Execution Steps**:
  1. Mobile Viewport, Dark Mode.
  2. Add single variant (retail price $25.00) to cart.
  3. Navigate to checkout, simulate Stripe failure response.
* **Verifications**:
  1. Verify responsive design elements display mobile cards.
  2. Verify error message "Payment declined by provider" is rendered in UI.
  3. Shopping cart still contains the product. No DB records added.

##### TC-3.5: Multi-Variant Fixed Markup Checkout (A2 + B2 + C1 + D1)
* **Objective**: Verify global fixed markup applies to multi-variant cart checkout, which processes successfully under mobile light mode.
* **Preconditions**: Settings configured with fixed markup of +$10.00. Product raw prices: Var A raw $10.00, Var B raw $12.00.
* **Execution Steps**:
  1. Mobile viewport, Light Mode.
  2. Add 1x Var A (expected retail $20.00) and 2x Var B (expected retail $22.00) to cart.
  3. Verify cart total is `$64.00`.
  4. Proceed to checkout, complete transaction.
* **Verifications**:
  1. Verify mobile-responsive Tailwind elements are active.
  2. Verify SQLite order created with total amount 6400 cents.
  3. Verify inventory of Var B is decremented by 2 in `product_variants` table.

##### TC-3.6: Fixed Markup Mixed Cart Cancellation (A2 + B3 + C2 + D1)
* **Objective**: Verify global fixed markup mixed cart checkout cancellation under desktop light mode.
* **Preconditions**: Settings configured with fixed markup +$5.00. Products A, B, and C imported.
* **Execution Steps**:
  1. Desktop light mode. Add 1x variant from Product A, B, and C each.
  2. Navigate to checkout, trigger Stripe mock and click "Cancel".
* **Verifications**:
  1. Verify cart is persistent, retaining all 3 items.
  2. Verify no records written to SQLite `orders` table.

##### TC-3.7: Custom Product Override Success (A3 + B1 + C1 + D2)
* **Objective**: Verify that custom product override overrides global markup rules for single variant storefront cart, checking out successfully in mobile dark mode.
* **Preconditions**: Settings configured with 1.5x multiplier. Product A has a custom pricing override of 2.0x multiplier. Base variant price is $15.00.
* **Execution Steps**:
  1. Mobile dark mode. Navigate to Product A details.
  2. Verify detail page displays price as `$30.00` (overriding global setting of `$22.50`).
  3. Add variant to cart, proceed to checkout, complete Stripe simulation.
* **Verifications**:
  1. Verify styling classes reflect dark mode theme.
  2. Verify SQLite DB order is successfully created with total 3000 cents.

##### TC-3.8: Custom Product Fixed Markup Success (A3 + B2 + C1 + D1)
* **Objective**: Verify custom product overrides (fixed markup override) apply to multiple variants of a single product during successful checkout in desktop light mode.
* **Preconditions**: Settings configured with 1.5x multiplier. Product A configured with custom override: `customMarkupType = 'fixed'`, `customMarkupValue = 500` (+$5.00). Base variants: Var A base $10.00, Var B base $12.00.
* **Execution Steps**:
  1. Desktop light mode.
  2. Add 2x Var A (expected retail $15.00) and 1x Var B (expected retail $17.00) to cart.
  3. Go to checkout page. Verify subtotal displays `$47.00`.
  4. Complete successful checkout.
* **Verifications**:
  1. Verify SQLite DB order total is 4700 cents.

##### TC-3.9: Mixed Cart with Custom Overrides Cancellation (A3 + B3 + C2 + D1)
* **Objective**: Verify mixed cart containing custom override products and global settings products preserves cart on checkout cancellation in mobile light mode.
* **Preconditions**: Settings configured with 1.5x multiplier. Product A (custom fixed markup +$5.00, base $10.00 -> retail $15.00). Product B (uses global 1.5x, base $20.00 -> retail $30.00).
* **Execution Steps**:
  1. Mobile viewport, Light mode.
  2. Add 1x Product A and 1x Product B to cart (total $45.00).
  3. Proceed to checkout, trigger Stripe mock, select "Cancel".
* **Verifications**:
  1. Verify cart is retained with 2 items totaling $45.00.
  2. Verify no records written to SQLite database.

---

### 4.2 Tier 4: Real-world Workload/Application Scenarios

#### Scenario 1: End-to-End Merchant Import & Customer Purchase Flow (Happy Path)
* **Objective**: Simulate a full administrative product import and customization sequence followed by a storefront discovery and successful customer transaction.
* **User Journey**:
  1. **Admin Login**: Admin navigates to `/admin/login` and logs in with standard admin credentials.
  2. **Markup Settings Configuration**: Admin navigates to `/admin/settings` and configures default fixed markup rules to +$5.00 (500 cents).
  3. **Product Import**: Admin navigates to `/admin/importer`, inputs AliExpress URL `https://www.aliexpress.com/item/10050012345678.html`, and triggers import. The mock client parses ID `10050012345678` and generates the smartwatch product.
  4. **Detail Overrides**: Admin edits the imported product in `/admin/products`: overrides the title to "UltraFit Smartwatch Series 9 - Premium Edition", updates description, adds tag "exclusive".
  5. **Storefront Search**: Customer visits storefront homepage `/`, inputs "UltraFit" in search bar. The listing grid filters to show the matching product.
  6. **Variant Selection**: Customer clicks the product card, landing on `/products/10050012345678`. They select options: "Midnight Black" and "Silicone" (base price $19.99, expected retail price $24.99).
  7. **Cart Management**: Customer adds the item to the cart, navigates to `/cart`, and increases quantity to 2 (subtotal displays $49.98).
  8. **Checkout**: Customer navigates to `/checkout`, enters name and shipping address. Click "Pay with Credit Card" triggering the mock Stripe dialog, select "Success".
* **System Assertions**:
  1. Admin authentication cookie/session successfully registered in database.
  2. Settings table updated to fixed markup 500 cents.
  3. Product, options, and variants successfully populated in SQLite tables.
  4. Custom overrides (title, description, tags) reflected in `/admin/products` list.
  5. Storefront filters cards correctly; DOM displays the custom title "UltraFit Smartwatch Series 9 - Premium Edition".
  6. Cart quantities, totals, and markup calculations match: `$24.99 * 2 = $49.98`.
  7. Stripe success handler triggers database order creation.
  8. SQLite tables `orders` and `order_items` verify database records: order total 4998 cents, status is 'paid', customer details present, variant inventory decremented by 2.
  9. Storefront cart badge resets to 0.

#### Scenario 2: The Stale Price Prevention and Re-calculation Flow
* **Objective**: Guard against malicious or accidental pricing exploitation where a storefront user adds an item to their cart, the administrator modifies the global or custom pricing, and the user attempts to check out with the outdated, lower pricing.
* **User Journey**:
  1. **Add to Cart**: Customer visits product page, selects variant with base price $10.00 and global markup multiplier 1.5x (retail price $15.00). Adds product to cart.
  2. **Proceed to Checkout**: Customer navigates to `/checkout` page. The subtotal displays `$15.00`.
  3. **Admin Settings Update**: Simultaneously (simulated in background test script), the administrator modifies the global markup multiplier to 2.0x. The database settings update. The product's correct retail price is now $20.00.
  4. **Submit Checkout**: Customer clicks checkout submission on the client side, sending the stale transaction value of $15.00.
  5. **Transaction Rollback**: The server action interceptor validates the cart items. It queries the current database product tables and global settings, recalculating the retail price ($20.00). It detects the price mismatch, aborts order registration, and returns a warning.
  6. **UI Recalculation**: The storefront UI captures the error response, updates the cart storage with the correct pricing, displays a warning toast "Pricing rules have changed. Please review updated total before submitting", and updates the checkout button label.
  7. **Resubmission**: Customer clicks "Submit Checkout" again with the updated total of `$20.00`. Stripe dialog completes, order is written.
* **System Assertions**:
  1. Initial checkout submission rejects with validation error `400 Bad Request` or custom error code `PRICING_CHANGED`.
  2. Database has no order records matching the initial submission.
  3. Cart UI displays a Tailwind alert (e.g. yellow borders, warning icon).
  4. Final checkout write in SQLite verifies total amount 2000 cents.

#### Scenario 3: Cart Session Persistence across Lifecycle Events with Invalidated Products
* **Objective**: Verify that storefront shopping cart state is safely preserved across browser lifecycle events (page refreshes, tab closures), and that the system gracefully handles scenarios where products in active carts are deleted by an admin in a parallel session.
* **User Journey**:
  1. **Cart Setup**: Customer adds Product A and Product B to storefront cart.
  2. **Browser Reload**: Test simulates browser reload (re-instantiating the storefront page component). Verify cart retains items.
  3. **Theme Toggle**: User toggles storefront color theme to Dark mode. Verify page styling updates.
  4. **Admin Deletion**: Administrator (background script) deletes Product A from the database via the admin panel.
  5. **Cart Validation**: Customer navigates to `/cart` or clicks "Proceed to Checkout".
  6. **Error Notification**: The cart component runs a quick sync validator against the backend. It flags Product A as "Item Unavailable / Out of Stock".
  7. **Action Blocked**: The checkout button is disabled. Product A's row in the cart is styled with a red border and a warning label.
  8. **Removal**: Customer clicks "Remove" on Product A. The remaining Product B is validated, checkout button becomes active, and checkout completes.
* **System Assertions**:
  1. Cart state persists in local storage and is correctly hydrated upon reload.
  2. Tailwind dark mode class updates contrast and background attributes safely.
  3. Sync validation correctly identifies missing product database reference.
  4. Cart prevents routing transition to checkout until deleted item is removed.

#### Scenario 4: Multi-Item Bulk Checkout with Mixed Markup Rules
* **Objective**: Verify storefront catalog search filtering, complex cart state management with mixed product overrides and global pricing multiplier calculations, mobile responsive layouts, and SQLite transaction breakdown.
* **User Journey**:
  1. **Seeding configuration**:
     - Global settings: Multiplier markup 1.5x.
     - Product A: base price $10.00 (standard multiplier pricing applies -> retail $15.00).
     - Product B: base price $20.00, custom override settings `markupType = 'fixed'`, value = $2.00 (retail price -> $22.00).
  2. **Search and Add**: Customer searches "Gadgets", finds Product A, adds 2 units to cart. Searches "Keyboards", finds Product B, adds 3 units to cart.
  3. **Viewport Adaptability**: User toggles viewport to mobile width (375px). 
  4. **Cart Review**: Customer opens cart. The cart layout shifts from desktop tables to vertical cards.
  5. **Total Verification**: UI displays itemized breakdown and subtotal: `$96.00` (`2 * $15.00 + 3 * $22.00`).
  6. **Checkout**: Proceed to checkout and complete Stripe payment.
* **System Assertions**:
  1. Cart component calculates the aggregate price correctly: `9600` cents.
  2. Tailwind CSS classes assert responsive visibility (e.g. desktop headers have `hidden md:table-cell`).
  3. SQLite database logs a single order in `orders` with `totalAmount = 9600` cents.
  4. SQLite `order_items` contains:
     - Row 1: Product A, unit price 1500 cents, quantity 2.
     - Row 2: Product B, unit price 2200 cents, quantity 3.

#### Scenario 5: Administrator Security Gates & Boundary Sanitization E2E
* **Objective**: Verify access-control middleware restricts guests, and that both client-side and server-side forms reject invalid configurations (negative markups, invalid URLs) with proper error styling.
* **User Journey**:
  1. **Unauthorized Access**: Guest attempts to direct link to `/admin/importer`. The router intercepts and redirects to `/admin/login` with redirect query.
  2. **Validation Failure (Login)**: Guest inputs blank fields and submits. Login page displays error indicators.
  3. **Validation Success (Login)**: Guest inputs valid credentials, logs in, and is redirected to `/admin/importer`.
  4. **Sanitization (Settings)**: Admin attempts to update margin multiplier to `-1.5` or fixed markup to `-500` cents. The settings form validates inputs via Zod schema, displays warnings, and blocks submission.
  5. **Import Exception**: Admin attempts to import AliExpress URL `https://invalid-url.com`. Importer catches parsing error, halts loading spinner, and displays toast.
* **System Assertions**:
  1. Route guards block unauthorized transitions.
  2. Input elements display styling classes like `border-red-500` and accessibility warnings (`aria-invalid="true"`).
  3. Importer handles parsing exceptions gracefully without crash. No records are written.

---

## 5. Propose Test Files Structure and Vitest Configuration

To ensure E2E integration tests compile and run reliably alongside the codebase (even as specific components/routes are being developed), we propose a dedicated testing directory under `tests/` and a tailored Vitest configuration.

### 5.1 Directory Structure

We recommend storing all test-related files in a top-level `tests/` directory:

```
tests/
├── setup.ts                 # Database migrations setup, Mock Server setup, jsdom routing mocks
├── e2e/                     # End-to-end integration tests (Tier 3 & Tier 4)
│   ├── tc-3-combinations.test.ts  # Tier 3: Cross-Feature combinations (TC-3.1 to TC-3.9)
│   └── tc-4-scenarios.test.ts     # Tier 4: Real-world Workload/Scenarios (Scenario 1 to 5)
└── mocks/                   # External provider stubs
    ├── stripe-mock.ts       # Stripe checkout browser frame mockup
    └── browser-env.ts       # window/localStorage/cookie mocks
```

### 5.2 Vitest Configuration File (`vitest.config.e2e.ts`)

A dedicated E2E configuration file isolates testing properties from standard unit tests, mapping aliases and setting up JSDOM environment parameters:

```typescript
// vitest.config.e2e.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    name: 'e2e',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/e2e/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
    },
  },
})
```

Add the E2E script entry to `package.json`:
```json
"test:e2e": "vitest --config vitest.config.e2e.ts run"
```

### 5.3 Test Environment Setup script (`tests/setup.ts`)

This setup script runs before each E2E test file. It initializes an in-memory SQLite database, runs Drizzle ORM migrations, sets up browser stubs (localStorage, session storage), and cleans up database state.

```typescript
// tests/setup.ts
import { beforeEach, afterEach, vi } from 'vitest'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../src/db/schema'

// 1. In-memory SQLite Database Setup for isolated fast runs
let testDbConnection: any
export let testDb: any

beforeEach(async () => {
  // Initialize in-memory DB connection
  testDbConnection = new Database(':memory:')
  testDb = drizzle(testDbConnection, { schema })

  // Run Drizzle migrations dynamically on the in-memory instance
  // Assumes migrations are generated in 'drizzle/' folder
  await migrate(testDb, { migrationsFolder: './drizzle' })

  // Mock global environmental database reference
  vi.mock('../src/db/index', () => ({
    db: testDb,
  }))

  // Seed default settings row
  await testDb.insert(schema.settings).values({
    id: 1,
    markupType: 'multiplier',
    marginMultiplier: 1.5,
    fixedMarkup: 0,
  })
})

afterEach(() => {
  if (testDbConnection) {
    testDbConnection.close()
  }
  vi.restoreAllMocks()
})

// 2. Mock browser interfaces (localStorage, Cookies, Session)
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window location changes / alerts
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
})

// Mock Stripe Checkout Dialog global hook
Object.defineProperty(window, 'StripeCheckoutMock', {
  value: {
    open: vi.fn((options: { amount: number; token: (res: any) => void; closed: () => void }) => {
      // Test code can trigger callback directly for simulation
      window.dispatchEvent(new CustomEvent('stripe-opened', { detail: options }))
    }),
  },
  writable: true,
})
```

---

## 6. Verification Method

To verify the test suite plan:

1. **Verify Compilation**:
   Ensure all TS types inside `tests/` align with schema options defined in `src/db/schema.ts` and pricing interfaces in `src/lib/pricing.ts`. Run the TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```
2. **Execute E2E Integration Suite**:
   Once the source routes and DB schema are fully compiled and configured, the test suite can be run via Vitest:
   ```bash
   npm run test:e2e
   ```
   Verify that all assertions succeed, generating test trajectories.
3. **Database Assertion Checks**:
   Check if the database side-effects in tests match:
   - For checkout success, query the in-memory SQLite order table:
     ```typescript
     const results = db.select().from(orders).all();
     expect(results.length).toBe(1);
     expect(results[0].totalAmount).toBe(expectedCents);
     ```
   - For validation errors, verify that no database record changes:
     ```typescript
     const results = db.select().from(orders).all();
     expect(results.length).toBe(0);
     ```
