# TanStack Start Application: Durable Project Context

This file maintains critical architecture, stack decisions, environment requirements, and operational guidelines for this TanStack Start application.

---

## Technical Stack & Integrations

- **Framework:** [TanStack Start](https://tanstack.com/start)
- **Routing:** [TanStack Router](https://tanstack.com/router)
- **Language & Runtime:** TypeScript, React (v19)
- **Build Tool:** Vite (v8)
- **Deployment & Hosting Target:** Cloudflare Pages / Workers
- **Package Manager:** `npm` (lockfile: `package-lock.json`)
- **Linting & Code Quality:** ESLint (flat config: `eslint.config.js`)
- **Styling:** Vanilla CSS + Tailwind CSS v4

---

## Commands Run & Scaffolding History

### 1. Initial Project Scaffolding
Scaffolded using the official **TanStack CLI**:
```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind --deployment cloudflare
```
*Note: Although the scaffolding was commanded with `--package-manager pnpm`, the files were migrated up one level and package management was locked to **npm** as per requirements.*

### 2. Dependency Installation
```bash
npm install
```

### 3. TanStack Intent Integration
```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```
*Note: A local patch was applied to `@tanstack/intent/package.json` to define the `./intent-library` subpath export requested by `@tanstack/devtools` to guarantee smooth execution.*

---

## TanStack Suite Integration & Demonstrations

This project is a unified showcase of **nine** core TanStack libraries:
1. **TanStack Start:** SSR routing, hydration, API handlers, and deployment.
2. **TanStack Router:** Type-safe route declarations and navigation under `src/routes/`.
3. **TanStack Intent:** AI-friendly package-shipped skills and guidance (ran install and list).
4. **TanStack CLI:** Project scaffolding and dev cycle runner.
5. **TanStack Query:** Seamless data-fetching engine with caching, integrated with SSR.
6. **TanStack Table:** Powerful tabular rendering with sorting and filtering.
7. **TanStack Form:** Robust form validation with type-safe state fields.
8. **TanStack Store:** Client-side lightweight state container for application-wide status (e.g., layout and sidebar filters).
9. **TanStack DB:** Client-side local collection store utilizing reactive live queries (`useLiveQuery`).

---

## Environment Variables

This application is designed to run in zero-config local environments. For production Cloudflare deployments:
- No explicit environment variables are required for basic startup.
- If integrating with database connectors, bind them via `wrangler.jsonc` bindings.

---

## Deployment & Hosting: Cloudflare

- **Target Service:** Cloudflare Pages (utilizing Workers runtime).
- **Tooling:** [Wrangler](https://developers.cloudflare.com/workers/wrangler/) v4.
- **Config:** `wrangler.jsonc` (at root level).
- **Deploy Command:**
  ```bash
  npm run deploy
  ```
- **Local Dev Server:**
  ```bash
  npm run dev
  ```

---

## Key Architectural Decisions

1. **Client-side DB Mocking with TanStack DB:**
   We have created a local-first in-memory reactive collection to mimic database operations on the client side, showing off live query updates and optimistic mutations.
2. **Global State via TanStack Store:**
   Slices of global client state (such as UI themes or active filters) are centralized using a lightweight TanStack Store slice.
3. **Integrated TanStack Query with SSR:**
   Data queries are handled via `@tanstack/react-query` to ensure optimized caching and caching states are hydrated correctly.

## Project-Scoped Rules

- **Interactive/Confirmation Rule:** Always ask for explicit permission or confirmation before generating markdown artifacts (`.md` files in the brain directory) or modifying configuration files, unless the user has explicitly requested it in the prompt.

---

## Known Gotchas & Workarounds

- **PowerShell Script Blocker (Windows):** Windows PowerShell execution policy might restrict running `npm` or `npx` directly. Resolve this by invoking `.cmd` explicitly (e.g., `npm.cmd` or `npx.cmd`).
- **TanStack Intent Export Path Patch:** The CLI command imported `@tanstack/intent/intent-library`, which was missing in the npm exports list. We manually added the mapping to the library's `package.json` to bypass node resolver issues.
- **Android/Termux Environment Binaries Shebang Workaround:** Running local CLI binaries (like `vitest`, `eslint`, `vite`, `tsr`) directly or via `npm run <script>` fails with `not found` due to the shebang interpreter path mismatch (missing `/usr/bin/env`). Run commands explicitly using Node, e.g.:
  - `node node_modules/vitest/vitest.mjs` instead of `npm run test`
  - `node node_modules/eslint/bin/eslint.js` instead of `npm run lint`
  - `node node_modules/vite/bin/vite.js` instead of `npm run dev`/`build`
  - `node node_modules/@tanstack/router-cli/bin/tsr.cjs` instead of `tsr generate`

---

## Finalized Architectural Decisions (Brainstorming Session)

1. **Validation & State Schema:** Replace `zod` entirely with `@effect/schema` across both frontend (forms) and backend validation.
2. **Local Dev Environment:** Resolved the `workerd` crash on Android/Termux by conditionally bypassing the Cloudflare Vite plugin during development.
3. **Authentication Strategy:** Implement standard registration/login using `better-auth`. Restrict administrative pages (inventory/product imports) to a designated email address (e.g., `admin@dstrkt.com`).
4. **AliExpress Product Sourcing**: Query RapidAPI AliExpress Scraper endpoints to fetch live item schemas, map them via `effect`, apply markdown multipliers (from the `settings` database), and insert them.
5. **Payment flow**: Stripe Hosted Checkout with webhook tracking (or server function status polling).
6. **Storefront Visual Design**: Public homepage converted to a high-aesthetic, visual tech-wear catalog with product grid details. System control dashboard moved to `/admin` route.
7. **Order Tracking & Log**: Authenticated user tracking path under `/profile` or `/orders` displaying interactive logs.

---

## Next Steps

1. Start local dev server: `npm run dev`
2. Uninstall `zod` and install `effect` and `@effect/schema`.
3. Create server-side `better-auth` API route and UI endpoints.
4. Scaffold the public-facing storefront and move the dashboard to `/admin`.
5. Integrate RapidAPI and Stripe checkout redirect server actions.

