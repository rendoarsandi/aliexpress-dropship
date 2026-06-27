# Milestone 1 Handoff Report: Database Schema & Importer Client

## 1. Observation

During our work on Milestone 1, we made the following direct observations:
- **`package.json`** lists `better-sqlite3` (v12.6.2), `drizzle-orm` (v0.45.1), `better-auth` (v1.5.3), `@faker-js/faker` (v10.3.0), and `vitest` (v4.1.5) as dependencies.
- **Native Build constraints in Termux**: When running `npm install`, the compilation of `better-sqlite3` failed because it could not find `prebuild-install` or `node-gyp`. Running `npm install --ignore-scripts` completed successfully. Installing `node-gyp` locally as a devDependency (`npm install --save-dev node-gyp --ignore-scripts`) and running node-gyp configure with `-Dandroid_ndk_path=/tmp` resolved the platform-specific NDK dependency:
  `gyp info spawn /data/data/com.termux/files/usr/bin/python3 ... -Dandroid_ndk_path=/tmp ...` -> `gyp info ok`.
  Running `node-gyp build` after creating the dependency directory structure (`mkdir -p build/Release/.deps/Release/obj.target/sqlite3/gen/sqlite3`) compiled `/data/data/com.termux/files/home/aliexpress-dropship/node_modules/better-sqlite3/build/Release/better_sqlite3.node` successfully.
- **Vitest Configuration**: `vitest.config.ts` originally had `include: ['tests/e2e/**/*.test.{ts,tsx}']`. Running `npx vitest` on files outside this path returned `No test files found, exiting with code 1`. Updating the include pattern to `['tests/e2e/**/*.test.{ts,tsx}', 'src/lib/__tests__/**/*.test.ts']` enabled direct unit test execution.
- **Global setup file**: `tests/setup.ts` initializes an in-memory SQLite database (`export const sqlite = new Database(':memory:')`), creates all catalog/auth/orders/settings tables, mocks `#db/index` to point to this `testDb`, and seeds a default row in `settings` (`id: 1, markupType: 'multiplier', marginMultiplier: 1.5`).

---

## 2. Logic Chain

1. **SQLite Database Schema Implementation**:
   - The auth schemas (`user`, `session`, `account`, `verification`) are defined in `src/db/schema.ts` to be compatible with better-auth's requirements. We added the `role` field (default `'user'`) to the `user` table to facilitate M3 route permissions.
   - Storefront catalog schemas (`products`, `productOptions`, `productVariants`) are implemented with normalized relational structures. `productId` columns on option and variant tables include a references constraint with `{ onDelete: 'cascade' }` to ensure cascading deletion.
   - Orders schemas (`orders`, `orderItems`) are implemented with custom JSON type mapping on combinations, and `{ onDelete: 'cascade' }` on order items to automatically clean up when orders are deleted.
   - Importer settings schema (`settings`) uses `id` as primary key defaulting to `1` so that any subsequent insert statement without specifying a new ID conflicts, preventing multi-row configuration drift and enforcing a single-row config.

2. **Pricing Utility**:
   - The helper function `calculateRetailPrice` uses integer cents to prevent IEEE 754 floating-point rounding errors. It applies fixed markups (added cents) or multipliers, and supports overrides for specific products.
   - `formatUSD(cents)` converts the integer cents back to standard decimal currency string representations using `Intl.NumberFormat`.

3. **AliExpress Mock Client**:
   - `parseProductUrl(url)` extracts the numeric ID from AliExpress item URLs.
   - `mockImportAliExpressProduct(urlOrId)` uses the numeric seed parsed from the ID to seed `faker` (`faker.seed(numericSeed)`), producing deterministic product titles, prices, descriptions, and variants.
   - `mockSearchAliExpress(keyword, limit, offset)` filters predefined items, and falls back to generating 4 deterministic search results seeded with the keyword's character code sum if no match is found.

4. **Integration Tests**:
   - Since `tests/setup.ts` already handles the in-memory database creation and cleanup, `src/lib/__tests__/milestone1.test.ts` imports the shared `testDb` to run assertions. This ensures our unit tests validate database logic and schema constraints under the identical environment settings used by the project.

---

## 3. Caveats

- **Database URL during migrations**: Since there are no default `.env` files in the workspace, we specify the environment variable `DATABASE_URL="file:sqlite.db"` inline when invoking the migrations script.
- **Node Execution on Termux**: Due to shebang errors in `/usr/bin/env` inside Termux, all local CLI binaries (like `vitest` and `drizzle-kit`) must be called by invoking `node` explicitly pointing to the `node_modules` file (e.g. `node node_modules/vitest/vitest.mjs` and `node node_modules/drizzle-kit/bin.cjs`).

---

## 4. Conclusion

All components for Milestone 1 have been successfully implemented, lint-checked, and verified:
- `src/db/schema.ts` holds the complete Drizzle SQLite schemas.
- `src/lib/pricing.ts` contains the cents-based markup calculations.
- `src/lib/aliexpress-mock.ts` provides the mock importer client.
- `src/lib/auth.ts` configures better-auth.
- `src/lib/__tests__/milestone1.test.ts` executes unit tests covering the schema behavior, mock client, and pricing helpers.
- Drizzle migrations have been generated and pushed to `sqlite.db`.

---

## 5. Verification Method

To verify the work independently, run the following commands from the project root:

1. **Verify schemas & push constraints**:
   ```bash
   DATABASE_URL="file:sqlite.db" node node_modules/drizzle-kit/bin.cjs generate
   DATABASE_URL="file:sqlite.db" node node_modules/drizzle-kit/bin.cjs push
   ```
   *Expected output*: Shows that the schema matches the database and `Changes applied` (or no changes needed).

2. **Verify unit tests**:
   ```bash
   node node_modules/vitest/vitest.mjs run src/lib/__tests__/milestone1.test.ts
   ```
   *Expected output*:
   ```
    ✓ src/lib/__tests__/milestone1.test.ts (13 tests) 152ms
      ✓ Milestone 1 Unit Tests (13)
        ✓ Database Operations (In-Memory SQLite) (4)
        ✓ Pricing helper operations (4)
        ✓ AliExpress Mock Client (5)
   ```

3. **Verify linting compliance**:
   ```bash
   node node_modules/eslint/bin/eslint.js src/db/schema.ts src/lib/pricing.ts src/lib/aliexpress-mock.ts src/lib/auth.ts src/lib/__tests__/milestone1.test.ts
   ```
   *Expected output*: Command completes successfully with exit code 0 and no output.
