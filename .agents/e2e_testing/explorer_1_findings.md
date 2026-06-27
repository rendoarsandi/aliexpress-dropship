# E2E Test Suite Plan for AliExpress Dropship Application

This document outlines a comprehensive, opaque-box end-to-end (E2E) integration test suite plan. The test suite leverages Vitest, JSDOM, and React Testing Library to simulate client interactions, server functions, database writes, and visual mode behaviors in a fully isolated environment.

---

## 1. Test Architecture & Strategy
Since the application is built using TanStack Start (React Router + Vite + Server Functions), we use **Vitest** with a **JSDOM** environment. This allows us to perform "opaque-box" testing:
- **Client-Side Interactions**: We render routes using React Testing Library, interact with the DOM as a user would (clicking buttons, filling forms), and verify UI updates.
- **Server Functions & Database**: Rather than making real network calls, Vitest directly invokes TanStack Start's server-side logic in-process, reading and writing to an in-memory SQLite database (`better-sqlite3` initialized with the Drizzle schema for every test run).
- **Authentication**: We stub the authentication state (better-auth client/session) through test helpers, avoiding real-world network overhead.

---

## 2. Test Case Specifications (Tiers 1 & 2)

### R1. Storefront Catalog (Product Listing, Detail, and Cart)
This feature covers the consumer-facing shopping interface, search, variant option selection, price calculations, and the local cart lifecycle.

#### Tier 1: Feature Coverage (5 Cases)
1. **Storefront Product Grid Rendering**
   - **User Actions**: Navigate to home `/`.
   - **Verification**: Ensure the header, search input, and a product grid render. Verify that cards show product images, titles, and dynamic prices.
2. **Product Navigation to Details**
   - **User Actions**: Click on a product card title.
   - **Verification**: URL changes to `/products/$id`, and the product detail page displays options (e.g. Size, Color), description, and pricing.
3. **Product Search Filtering**
   - **User Actions**: Enter "watch" in the search input and submit the search form.
   - **Verification**: Only products containing the term "watch" in their title or description are displayed. Product cards for unrelated items are removed from the DOM.
4. **Dynamic Variant Option Selection & Pricing**
   - **User Actions**: On `/products/$id`, click on variant option buttons (e.g., Color: "Blue", Size: "M").
   - **Verification**: The displayed selling price changes dynamically to match the price stored for the "Blue - M" variant.
5. **Cart Persisted CRUD Cycle**
   - **User Actions**: Click "Add to Cart" on a selected variant. Go to `/cart`, increase quantity from 1 to 2, then refresh the page.
   - **Verification**: Cart icon count changes to 2. Cart page shows the item with correct variants, updated line total, and grand total. After refresh, local storage retains the items.

#### Tier 2: Boundary & Corner Cases (5 Cases)
1. **Out of Stock Variant Behavior**
   - **User Actions**: Select a variant combination with 0 inventory.
   - **Verification**: The "Add to Cart" button is disabled and displays "Out of Stock". Clicking it does not change cart size.
2. **Cart Quantity Input Sanitization**
   - **User Actions**: On the cart page, type `-5`, `0`, or `1000` (exceeding stock limit) in the quantity input field.
   - **Verification**: System rejects the value, defaulting to 1 (or removing the item on `0`) or capping the input at the max available stock limit.
3. **XSS & Special Characters in Search**
   - **User Actions**: Enter `<script>alert('xss')</script>` or special characters (`%`, `_`, `*`) in the search input.
   - **Verification**: The page does not crash, does not execute the script, and renders safely showing "No products found".
4. **Non-Existent Product Detail Route**
   - **User Actions**: Navigate directly to `/products/invalid-id`.
   - **Verification**: The page displays a friendly "Product Not Found" screen instead of crashing, with a link to return to the catalog.
5. **Partial Variant Choice Interceptor**
   - **User Actions**: For a product with two option types (Color & Size), select only "Color: Red" and attempt to click "Add to Cart".
   - **Verification**: Page shows a validation message ("Please select a Size"), and the item is not added to the cart.

---

### R2. AliExpress Importer Admin Panel
This covers access control, product search and retrieval from the mock AliExpress client, importing to the SQLite store, and manual metadata overrides.

#### Tier 1: Feature Coverage (5 Cases)
1. **Unauthenticated Redirect (Access Control)**
   - **User Actions**: Attempt to visit `/admin/importer` without logging in.
   - **Verification**: User is redirected to `/admin/login` with an access-denied state.
2. **Successful Admin Authentication**
   - **User Actions**: Visit `/admin/login`, enter correct admin credentials, and click "Login".
   - **Verification**: System signs user in using `better-auth`, redirects to `/admin/importer`, and exposes the admin navigation menu.
3. **Keyword Search Import Execution**
   - **User Actions**: Search for "headphones" in the importer dashboard, select an item, and click "Import".
   - **Verification**: Product details, options, and variants are retrieved via the mock client, stored in SQLite database, and a success notification is shown.
4. **URL Import Execution**
   - **User Actions**: Paste a mock AliExpress product URL in the input field and click "Import".
   - **Verification**: System parses the URL, retrieves the product structure, calculates base selling prices, stores them, and redirects to `/admin/products`.
5. **Product Metadata Editing & Saving**
   - **User Actions**: Navigate to `/admin/products`, click edit on a product, modify title, description, and tags, then click "Save".
   - **Verification**: Database record updates. Navigating to the storefront `/products/$id` displays the updated title and description.

#### Tier 2: Boundary & Corner Cases (5 Cases)
1. **Invalid URL Formats**
   - **User Actions**: Input a malformed URL (e.g. `http://not-aliexpress.com/item`) in the URL import input.
   - **Verification**: Input field shows a validation error ("Invalid AliExpress URL format") and blocks the network request.
2. **Mock API Failure and Recovery**
   - **User Actions**: Simulate a mock AliExpress API timeout or offline error during search.
   - **Verification**: Importer UI displays an error message ("Failed to connect to AliExpress. Please try again.") and does not freeze or crash.
3. **Invalid Price Markups (Validation Rules)**
   - **User Actions**: Go to `/admin/settings` and try to set fixed markup to `-5.00` or margin multiplier to `0` or negative values.
   - **Verification**: The form validates input and shows errors ("Markup/Multiplier must be greater than zero"), preventing settings update.
4. **Duplicate Product Imports**
   - **User Actions**: Attempt to import an AliExpress product ID that already exists in the SQLite database.
   - **Verification**: Importer detects duplicate and displays "Product already imported. [Link to edit]". It does not insert duplicate rows.
5. **Session Expiry Handler**
   - **User Actions**: Clear local session state (cookies/tokens) while editing a product, then submit the "Save" form.
   - **Verification**: Request fails, changes are not saved to SQLite, and user is redirected to `/admin/login` with a message "Session expired".

---

### R3. Checkout and SQLite Store
This covers checkout forms, simulated payment gateway integration, database order generation, and settings synchronization.

#### Tier 1: Feature Coverage (5 Cases)
1. **Checkout Shipping Form Input**
   - **User Actions**: Place items in the cart, navigate to `/checkout`, fill in all shipping fields (Name, Address, City, Zip, Country).
   - **Verification**: Next step is unlocked, and form data is validated correctly.
2. **Stripe Payment Gateway Mock Success**
   - **User Actions**: Click "Proceed to Payment", enter mock visa details in the Stripe simulation modal, and click "Pay".
   - **Verification**: Modal shows spinner, shows checkmark, closes, and redirects to `/checkout/confirmation`.
3. **Database Order Verification**
   - **User Actions**: Place an order successfully.
   - **Verification**: Check the SQLite database `orders` and `order_items` tables. Ensure a new order record exists with the correct total, customer shipping details, items, selected options, and status set to "Paid".
4. **Markup Formula Settings Application**
   - **User Actions**: In `/admin/settings`, set markup to "multiplier" with value `1.5` and save. Import a new product with raw price `$10.00`.
   - **Verification**: Check the storefront price of the imported product. It must render as `$15.00` (applying the settings row stored in SQLite).
5. **Order Confirmation Display**
   - **User Actions**: Land on `/checkout/confirmation` after successful payment.
   - **Verification**: The screen displays a unique order reference number, matching shipping address summary, list of purchased products, and clear success message.

#### Tier 2: Boundary & Corner Cases (5 Cases)
1. **Payment Gateway Declines & Error States**
   - **User Actions**: Trigger a payment error by submitting a mock declining card number in the simulated Stripe modal.
   - **Verification**: Payment modal displays "Card Declined. Please try another card." The transaction is aborted, no order is saved in the DB, and the shopping cart remains intact.
2. **Direct Checkout Navigation with Empty Cart**
   - **User Actions**: Visit `/checkout` directly when the local shopping cart is empty.
   - **Verification**: Page redirects to storefront homepage `/` with a toast/alert "Cart is empty".
3. **Database Transaction Rollback on Failure**
   - **User Actions**: Force a database write error (e.g. mock db query constraint failure) during order saving.
   - **Verification**: System rolls back the database transaction. The order is not recorded, cart is not cleared, and a message "Payment succeeded but order recording failed. Contact support." is shown.
4. **Missing/Invalid Zip Code & Shipping Input Validation**
   - **User Actions**: Leave Zip Code blank or enter a letters-only string for Country zip code validation in the checkout form.
   - **Verification**: Form submission is blocked, validation message highlights the invalid field.
5. **Cart Price Locking During Checkout**
   - **User Actions**: Admin updates a product's price markup rules in settings while a customer is on the checkout screen.
   - **Verification**: The checkout process uses the price locked when the items were added to the cart, preventing order amount mismatch upon final checkout.

---

### R4. Modern Styling (Tailwind CSS v4 & Theming)
This covers theme switching, responsive design, contrast, and layout integrity across screen sizes.

#### Tier 1: Feature Coverage (5 Cases)
1. **Dark/Light Mode Theme Toggle**
   - **User Actions**: Click the theme toggle icon in the header.
   - **Verification**: The `dark` class is toggled on the `<html>` or `<body>` element, and elements change styling (e.g. background changes from white to gray-900).
2. **Responsive Mobile Layout adaptation**
   - **User Actions**: Set the testing environment viewport to a mobile width (375px).
   - **Verification**: The navigation bar collapses into a hamburger icon, and product listing grid columns rearrange to 1 or 2 columns instead of 4.
3. **Tailwind CSS Class Renders**
   - **User Actions**: Query storefront elements (e.g. button, text badges).
   - **Verification**: The HTML elements contain expected Tailwind v4 typography and layout classes (e.g., `flex`, `grid`, `text-sm`, `bg-primary`, `font-bold`).
4. **Keyboard Focus Outline Styling**
   - **User Actions**: Use `Tab` key to navigate inputs and buttons.
   - **Verification**: Focus rings are visible on active elements (Tailwind focus states, e.g., `focus:ring-2 focus:ring-blue-500`).
5. **System Theme Detection**
   - **User Actions**: Set system dark mode preference to `true` (mock media query `prefers-color-scheme: dark`) and load page.
   - **Verification**: The application loads in dark mode by default without manual toggling.

#### Tier 2: Boundary & Corner Cases (5 Cases)
1. **LocalStorage Corruption Fallback**
   - **User Actions**: Set local storage key `theme` to `invalid_theme_value` and reload.
   - **Verification**: The application falls back to system preference or default light theme without crashing.
2. **Extreme Viewport Resolutions**
   - **User Actions**: Simulate extremely narrow viewports (280px) and wide viewports (2560px).
   - **Verification**: Text does not overflow out of containment boxes, and wide layouts cap maximum width with proper side gutters.
3. **Contrast Compliance verification**
   - **User Actions**: Render alert banners and button states in both dark and light modes.
   - **Verification**: Assert background-color and text-color classes maintain a contrast ratio complying with readability guidelines.
4. **Pre-Render Theme Flash Prevention**
   - **User Actions**: Execute page mount sequence.
   - **Verification**: Theme loading script runs before rendering body to avoid FOUC (Flash of Unstyled Content) or light theme flashing.
5. **Modal Overlay Transitions**
   - **User Actions**: Trigger checkout modal.
   - **Verification**: Modal backdrop and container classes transition smoothly without visual snapping or alignment jumps.

---

## 3. Proposed Test File Structure
All E2E integration tests will reside in the `tests/e2e/` folder to separate them from unit tests.

```
tests/
├── setup.ts                 # Global test environment, JSDOM, SQLite in-memory, Better-Auth mocks
├── e2e/
│   ├── r1-storefront.test.tsx # Storefront listing, search, details, and cart CRUD tests
│   ├── r2-importer.test.tsx   # Admin dashboard, auth login, mock imports, settings edit
│   ├── r3-checkout.test.tsx   # Checkout form, Stripe dialog, SQL order storage
│   └── r4-styling.test.tsx    # Tailwind v4 class coverage, theme toggles, responsiveness
└── mocks/
    ├── aliexpress-client.ts   # Interceptor / stub values for mock products
    └── db-mock.ts             # SQLite memory db helper functions
```

---

## 4. Vitest Configuration & Execution

### Vitest Config (`vitest.config.ts`)
To configure Vitest to compile code and use JSDOM, create a `vitest.config.ts` in the project root:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/e2e/**/*.test.{ts,tsx}'],
      css: true, // Enables parsing of Tailwind CSS files for style calculations
      coverage: {
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*'],
      },
    },
  })
)
```

### Setup File (`tests/setup.ts`)
This setup file runs before any test suite executes:

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { vi } from 'vitest'

// Automatically clean up react trees after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for theme preference checks
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Setup an isolated in-memory SQLite database configuration
import { db } from '../src/db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

beforeAll(async () => {
  // Mock sqlite db path or run migrations on the in-memory SQLite client
  // Example: Migrate database schema before E2E tests run
})
```

### Execution Commands
Add or modify scripts in `package.json` to trigger the tests:

- **Run all E2E tests once**: `npm run test` or `npx vitest run --config vitest.config.ts`
- **Run tests in watch mode**: `npx vitest --config vitest.config.ts`
- **Generate coverage report**: `npx vitest run --coverage --config vitest.config.ts`
