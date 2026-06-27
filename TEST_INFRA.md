# E2E Test Suite Infrastructure Documentation

This document outlines the testing architecture, environment configuration, mocking strategies, and database isolation setup used for the AliExpress Dropship application.

---

## 1. Testing Architecture & Harness

The E2E test suite is designed as an **opaque-box integration testing track** executing inside an isolated and fast environment without the overhead of heavy browser automation engines.

- **Test Runner**: [Vitest](https://vitest.dev/) (v4.1.5)
- **Environment**: [JSDOM](https://github.com/jsdom/jsdom) (v28.1.0)
- **Component Rendering**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) (v16.3.0)
- **Database Engine**: In-memory SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (v12.6.2) wrapped with [Drizzle ORM](https://orm.drizzle.team/) (v0.45.1)

All test executions run programmatically inside a single Node.js process. When server actions or DB queries are invoked, they execute synchronously against the in-memory SQLite database, achieving sub-second E2E flows.

---

## 2. Configuration & Setup Files

### 2.1. Vitest Configuration: `vitest.config.ts`
Vite/Vitest is configured to run in JSDOM, register global variables, specify setup scripts, and resolve module aliases (`#/*` and `@/*` pointing to `src/*`):

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '#': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/e2e/**/*.test.{ts,tsx}'],
  },
})
```

### 2.2. Global Setup: `tests/setup.ts`
The setup file prepares the environment before executing test suites:
- **JSDOM Polyfills**: Mocks `window.matchMedia` and `localStorage` to emulate standard browser behaviors.
- **Database Connection & DDL Push**: Instantiates an isolated in-memory SQLite database (`:memory:`) and executes the DDL creation query for all relational tables (Products, Options, Variants, Orders, Items, Settings, Auth).
- **Module Hook Mocking**: Mocks `@tanstack/react-router` and `#/*` database imports globally to route database calls directly to the test database.
- **Session Control Hooks**: Exports `setMockSessionData(session)` and `getMockSessionData()` to allow test cases to dynamically log in/out mock users (such as standard admin accounts).

### 2.3. Test Render Utility: `tests/test-utils.tsx`
Exports `renderWithProviders` helper to wrap components with `QueryClientProvider` from TanStack Query, resetting query caches between runs.

---

## 3. Mocking & Stubbing Strategy

To run E2E scenarios reliably without live external networks or route-generation bottlenecks, the following mocks are implemented:

1. **Routing Mock (`@tanstack/react-router`)**:
   Mocks `Link` to render standard anchor tags modifying `window.location.hash`, and `useNavigate` to simulate hash changes. The test runner asserts against `window.location.hash` to verify navigation.
2. **Authentication Mock (`better-auth`)**:
   Mocks `authClient` module methods. Logging in via `<AdminLogin />` changes the active session context in the closure, which immediately updates `<AdminImporter />` access restrictions.
3. **Payment Dialog Mock (Stripe Simulation)**:
   Simulates credit card charges. Inputting declining patterns (e.g. `decline@example.com` or card name `Decline`) triggers simulated card rejection errors.
4. **AliExpress API Client (`src/lib/aliexpress-mock.ts`)**:
   Intercepts product fetches. Provides preloaded static items (like UltraFit Smartwatch) and uses seeded `@faker-js/faker` to generate mock products deterministically. Custom alphanumeric URLs/IDs containing `'error'` or `'offline'` simulate API timeouts/failures.

---

## 4. Database Schema Setup

The database schema (`src/db/schema.ts`) is fully implemented with:
- **Auth Tables**: `user` (with `role` field), `session`, `account`, `verification`.
- **Product Tables**: `products` (with custom markup override attributes), `product_options` (with JSON modes), `product_variants` (with inventory levels).
- **Order Tables**: `orders` (with customer metadata and payment info), `order_items`.
- **Settings Table**: `settings` (locks configuration to `id = 1` for single-row safety).

---

## 5. Running the Test Suite

### Compilation Toolchain
Native extension compilation in Termux requires setting Android NDK flags during build. If the build fails:
```bash
GYP_DEFINES="android_ndk_path=/tmp" node ./node_modules/node-gyp/bin/node-gyp.js rebuild --release
```

### Running Tests
To run the E2E and Unit test suites:
```bash
node ./node_modules/vitest/vitest.mjs run
```
