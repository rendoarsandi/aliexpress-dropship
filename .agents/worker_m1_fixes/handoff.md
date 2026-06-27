# Handoff Report — worker_m1_fixes (Milestone 1 Fixes Iteration 2)

## 1. Observation
- **Seed Fallback Bug**: Product IDs ending in eight zeros (e.g., `10050000000000`) evaluating to `0` were treated as falsy and fell back to seed `99999` in `src/lib/aliexpress-mock.ts`.
- **URL/ID Parsing Bug**: `parseProductUrl` matched alphanumeric strings `/^\w+$/` for standalone IDs, accepting invalid IDs. The E2E tests also required error handling for URLs containing non-numeric keywords (e.g. `/item/error.html` returning `"error"`).
- **Duplicate SKUs**: Options generated via `faker.color.human()` could be duplicates, and 3-character prefixes generated variant collisions (e.g. Grey and Green both resolving to `GRE`).
- **Pricing Bound & Rounding**: `calculateRetailPrice` returned negative cents under negative markups and returned float cents on fixed markups when raw prices were floats.
- **Missing Transaction**: DB insertions for products, options, and variants in `src/components/Stubs.tsx` were executed without a surrounding transaction block, leaving orphaned records upon partial import failures.
- **Router Mock Crash**: The vitest suite crashed on `tests/e2e/tier2.test.tsx` because `@tanstack/react-router` mock in `tests/setup.ts` lacked the `createRootRouteWithContext` method.

Verbatim errors initially seen when running the test suites:
- Test: `Mock API Failure and Recovery` failed with `expect(element).toHaveTextContent() - Expected: Failed to connect to AliExpress. Please try again. Received: Invalid AliExpress Product URL or ID format.`
- Test: `should check for SKU collisions and color generation errors` failed with `expected 0 to be greater than 0` (after initial mock client SKU collision fix, since it asserted the existence of collisions).

## 2. Logic Chain
1. **Fixing Seeding Fallback**: By checking `isNaN(parsedSeed)` instead of `parsedSeed || 99999`, seed `0` does not trigger the fallback, ensuring deterministic, separate products for IDs ending in eight zeros.
2. **Fixing URL/ID Parsing**: Changing `/^\w+$/` to `/^\d+$/` ensures standalone IDs must be digits. Leaving the pattern `/item/(\w+).html` ensures test tokens (like `error`, `offline`, `timeout`) continue to parse correctly from URLs and throw connection errors instead of invalid URL errors.
3. **Preventing Duplicate SKUs**: Color values are generated in a `while` loop until they are unique. During variant SKU generation, a set of already generated SKUs resolves collisions by appending `-1`, `-2`, etc.
4. **Fixing Pricing**:
   - `Math.max(0, result)` ensures no negative storefront prices are returned.
   - `Math.round(rawPriceCents + fixedAdd)` ensures all prices are integer cents in the fixed markup branch.
5. **Wrapping Importer in Transaction**: Wrapping DB inserts in `db.transaction(tx => { ... })` and substituting the transaction client `tx` ensures all operations roll back if any variant insert fails.
6. **Router Mock Resolution**: Adding `createRootRouteWithContext: vi.fn().mockReturnValue(() => vi.fn().mockReturnValue({}))` to `tests/setup.ts` satisfies imports in `src/routes/__root.tsx`.

## 3. Caveats
- No caveats.

## 4. Conclusion
All milestone 1 fixes have been successfully implemented and verified. All unit tests, challenger tests, and E2E tier2 tests pass without any warnings or failures.

## 5. Verification Method
Verify that the tests run and pass using the following commands:
```bash
node node_modules/vitest/vitest.mjs run src/lib/__tests__/milestone1.test.ts
node node_modules/vitest/vitest.mjs run src/lib/__tests__/challenger.test.ts
node node_modules/vitest/vitest.mjs run tests/e2e/tier2.test.tsx
```
All 51 tests across these files must pass.
Files modified to inspect:
- `src/lib/aliexpress-mock.ts`
- `src/lib/pricing.ts`
- `src/components/Stubs.tsx`
- `tests/setup.ts`
- `src/lib/__tests__/challenger.test.ts`
