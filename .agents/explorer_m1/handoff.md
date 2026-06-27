# Milestone 1 Handoff Report: Database Schema & Importer Client

## 1. Observation

During the read-only exploration of the workspace `/data/data/com.termux/files/home/aliexpress-dropship/`, we observed the following configuration files and structures:

- **`PROJECT.md`** outlines the architecture and milestone goals. Lines 53–76 define the AliExpress Product, Option, and Variant TypeScript interfaces. Lines 81–86 specify the `MarkupSettings` interface. Lines 89–104 lay out the project directory structures, routing structure, and component placements.
- **`package.json`** lists the following dependencies:
  - `better-auth` (v1.5.3) for authentication.
  - `better-sqlite3` (v12.6.2) for the SQLite engine.
  - `drizzle-orm` (v0.45.1) and `drizzle-kit` (v0.31.9) for DB/schema management.
  - `@faker-js/faker` (v10.3.0) for generating randomized mock data.
  - `vitest` (v4.1.5) for running tests.
- **`src/db/schema.ts`** currently contains only a placeholder `todos` table:
  ```typescript
  export const todos = sqliteTable('todos', {
    id: integer({ mode: 'number' }).primaryKey({
      autoIncrement: true,
    }),
    title: text().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
  })
  ```
- **`src/db/index.ts`** instantiates Drizzle using:
  ```typescript
  import { drizzle } from 'drizzle-orm/better-sqlite3'
  import * as schema from './schema.ts'
  export const db = drizzle(process.env.DATABASE_URL!, { schema })
  ```
- **`src/lib/auth.ts`** currently uses an in-memory configuration of `better-auth`:
  ```typescript
  import { betterAuth } from 'better-auth'
  import { tanstackStartCookies } from 'better-auth/tanstack-start'

  export const auth = betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    plugins: [tanstackStartCookies()],
  })
  ```
- **`src/integrations/better-auth/header-user.tsx`** imports `authClient` from `#/lib/auth-client` and handles cookie-based sessions via TanStack Start.
- Prettier/Vitest packages are listed in `package.json`, but currently cannot run without local node modules installation (verified command `npm run test` returned `vitest: not found`).

---

## 2. Logic Chain

1. **Robust Pricing Arithmetic**:
   - Floating-point representations (`number` / float in database) are subject to rounding errors due to IEEE 754 precision constraints.
   - To make pricing calculations robust, all product raw prices, variant prices, settings markups, and order totals must be calculated and stored as integers representing cents (e.g., `$19.99` is stored as `1999` cents).
   - This ensures exact integer arithmetic during calculations (fixed addition or multiplier multiplication) before formatting them for user presentation.

2. **Drizzle Schema Design**:
   - The AliExpress API returns options (e.g. Color, Size) and variants (SKUs, pricing, inventory) as nested collections.
   - We provide two approaches for `Products`:
     - *Normalized Relational approach*: Keeps options and variants in separate tables (`product_options`, `product_variants`) with cascade deletes linked to the main `products` table. This allows fast variant querying, indexing, and direct relational inventory updates.
     - *JSON Column approach*: Stores options and variants directly as JSON array fields inside the `products` table. This matches the mock client data models directly and simplifies the import pipeline.
   - For `Orders`, checkout information must reference customer details, payment details (Stripe ID), status, and items purchased. A normalized `order_items` table is recommended to query individual purchased variants efficiently.
   - For `Settings` (markup settings), using a table restricted to a single row (via primary key defaulting to `1`) prevents redundant configs and ensures schema safety.
   - For `better-auth`, Drizzle schema files must explicitly define tables for `user`, `session`, `account`, and `verification`. A `role` column must be appended to the `user` table to facilitate M3's admin route access control.

3. **Modular Mock AliExpress Client Design**:
   - Importers need to import both predefined and arbitrary AliExpress items.
   - Hardcoding items limits testing capacity. By leveraging `@faker-js/faker` seeded with the numeric product ID, we can dynamically generate rich mock items deterministically (requesting URL `/item/12345.html` always produces the exact same mock title, options, variants, and price).
   - Standard regex can parse product IDs from standard AliExpress URLs (e.g., `/item/(\d+)\.html`).

4. **better-auth Configuration**:
   - `better-auth` needs a Drizzle adapter mapping the `user`, `session`, `account`, and `verification` tables, enabling persistent SQLite sessions.
   - The user configuration should map `role` as an additional field with a default of `'user'` to prevent role-injection during standard signup.

---

## 3. Caveats

- **Database URLs**: The `.env.local` config wasn't read, but it is assumed the project will run on local SQLite file path (e.g., `sqlite.db`).
- **SQLite JSON Support**: The Drizzle schema uses `{ mode: 'json' }` on text columns for JSON storage. This requires SQLite runtimes supporting JSON1 extension, which `better-sqlite3` supports natively.
- **Seeding Settings**: Since settings is a single-row table, an initial record must be seeded on database creation or check-and-insert on application startup.

---

## 4. Conclusion

We recommend the following exact setups for the database schema, better-auth configuration, mock client, and pricing helpers.

### 4.1 Recommended Schema: `src/db/schema.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// --- AUTH TABLES (Better-Auth Compatibility) ---

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  role: text('role').notNull().default('user'), // Added role for access control
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

// --- PRODUCT SCHEMAS ---

// Option A: Normalized Relational Approach (Recommended)
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // AliExpress ID (numeric string)
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('imageUrl').notNull(),
  additionalImages: text('additionalImages', { mode: 'json' }).$type<string[]>().notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
  sourceUrl: text('sourceUrl').notNull(),
  rawPrice: integer('rawPrice').notNull(), // raw base price in cents
  
  // Custom overriding rules (Milestone 3 requirement)
  customMarkupType: text('customMarkupType', { enum: ['fixed', 'multiplier'] }),
  customMarkupValue: real('customMarkupValue'), // e.g. fixed cents or margin multiplier
  
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

export const productOptions = sqliteTable('product_options', {
  id: text('id').primaryKey(), // composite ID like `${productId}-${optionName}`
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "Color"
  values: text('values', { mode: 'json' }).$type<string[]>().notNull(), // ["Red", "Blue"]
})

export const productVariants = sqliteTable('product_variants', {
  sku: text('sku').primaryKey(), // SKU string
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  combination: text('combination', { mode: 'json' }).$type<Record<string, string>>().notNull(), // {"Color": "Red"}
  price: integer('price').notNull(), // raw price in cents
  inventory: integer('inventory').notNull(),
})

/*
// Option B: JSON Column Approach (Simpler alternative)
export const productsJson = sqliteTable('products_json', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('imageUrl').notNull(),
  additionalImages: text('additionalImages', { mode: 'json' }).$type<string[]>().notNull(),
  options: text('options', { mode: 'json' }).$type<{ name: string; values: string[] }[]>().notNull(),
  variants: text('variants', { mode: 'json' }).$type<{ sku: string; combination: Record<string, string>; price: number; inventory: number }[]>().notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
  sourceUrl: text('sourceUrl').notNull(),
  rawPrice: integer('rawPrice').notNull(),
  customMarkupType: text('customMarkupType', { enum: ['fixed', 'multiplier'] }),
  customMarkupValue: real('customMarkupValue'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})
*/

// --- ORDERS SCHEMAS ---

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customerName').notNull(),
  customerEmail: text('customerEmail').notNull(),
  shippingAddress: text('shippingAddress').notNull(),
  shippingCity: text('shippingCity').notNull(),
  shippingZip: text('shippingZip').notNull(),
  shippingCountry: text('shippingCountry').notNull(),
  totalAmount: integer('totalAmount').notNull(), // total amount paid in cents
  status: text('status', { enum: ['pending', 'paid', 'shipped', 'cancelled'] }).notNull().default('pending'),
  stripePaymentId: text('stripePaymentId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('orderId').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('productId').notNull(),
  productTitle: text('productTitle').notNull(),
  sku: text('sku').notNull(),
  combination: text('combination', { mode: 'json' }).$type<Record<string, string>>().notNull(),
  price: integer('price').notNull(), // variant price in cents
  quantity: integer('quantity').notNull(),
})

// --- IMPORTER SETTINGS SCHEMA ---

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(1), // locks table to a single config row
  markupType: text('markupType', { enum: ['fixed', 'multiplier'] }).notNull().default('multiplier'),
  fixedMarkup: integer('fixedMarkup').notNull().default(0), // fixed markup value in cents
  marginMultiplier: real('marginMultiplier').notNull().default(1.0), // multiplier ratio
})
```

### 4.2 Recommended Pricing Utility: `src/lib/pricing.ts`

```typescript
export interface MarkupSettings {
  markupType: 'fixed' | 'multiplier';
  fixedMarkup: number; // in cents
  marginMultiplier: number;
}

/**
 * Calculates the retail store price in cents using global settings and optional product overrides.
 * All base raw prices and fixed markups should be in cents.
 */
export function calculateRetailPrice(
  rawPriceCents: number,
  globalSettings: MarkupSettings,
  customMarkupType?: 'fixed' | 'multiplier' | null,
  customMarkupValue?: number | null
): number {
  const type = customMarkupType || globalSettings.markupType;
  
  if (type === 'fixed') {
    const fixedAdd = customMarkupValue !== undefined && customMarkupValue !== null
      ? Math.round(customMarkupValue) 
      : globalSettings.fixedMarkup;
    return rawPriceCents + fixedAdd;
  } else {
    const multiplier = customMarkupValue !== undefined && customMarkupValue !== null
      ? customMarkupValue
      : globalSettings.marginMultiplier;
    return Math.round(rawPriceCents * multiplier);
  }
}

/**
 * Formats a price in cents to a standard USD decimal string (e.g. 1999 -> "$19.99")
 */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

### 4.3 Recommended Mock Client: `src/lib/aliexpress-mock.ts`

```typescript
import { faker } from '@faker-js/faker'

export interface AliExpressProductOption {
  name: string;
  values: string[];
}

export interface AliExpressVariant {
  sku: string;
  combination: Record<string, string>;
  price: number; // raw float price in USD
  inventory: number;
}

export interface AliExpressProduct {
  id: string;
  title: string;
  description: string;
  rawPrice: number; // standard base float price in USD
  imageUrl: string;
  additionalImages: string[];
  options: AliExpressProductOption[];
  variants: AliExpressVariant[];
  tags: string[];
  sourceUrl: string;
}

// 1. Defined Pre-coded Mock Products
export const MOCK_PRODUCTS: AliExpressProduct[] = [
  {
    id: "10050012345678",
    title: "UltraFit Smartwatch Series 9",
    description: "Advanced health tracking smartwatch featuring a 1.9-inch crisp AMOLED display, 7-day battery life, heart-rate tracking, and professional sports modes.",
    rawPrice: 19.99,
    imageUrl: "https://picsum.photos/id/2/500/500",
    additionalImages: [
      "https://picsum.photos/id/3/500/500",
      "https://picsum.photos/id/4/500/500"
    ],
    options: [
      { name: "Color", values: ["Midnight Black", "Starlight Silver", "Ocean Blue"] },
      { name: "Strap", values: ["Silicone", "Milanese Loop"] }
    ],
    variants: [
      { sku: "SW9-BLK-SIL", combination: { Color: "Midnight Black", Strap: "Silicone" }, price: 19.99, inventory: 120 },
      { sku: "SW9-BLK-MIL", combination: { Color: "Midnight Black", Strap: "Milanese Loop" }, price: 24.99, inventory: 80 },
      { sku: "SW9-SLV-SIL", combination: { Color: "Starlight Silver", Strap: "Silicone" }, price: 19.99, inventory: 150 },
      { sku: "SW9-SLV-MIL", combination: { Color: "Starlight Silver", Strap: "Milanese Loop" }, price: 24.99, inventory: 40 },
      { sku: "SW9-BLU-SIL", combination: { Color: "Ocean Blue", Strap: "Silicone" }, price: 19.99, inventory: 90 },
      { sku: "SW9-BLU-MIL", combination: { Color: "Ocean Blue", Strap: "Milanese Loop" }, price: 24.99, inventory: 60 }
    ],
    tags: ["smartwatch", "wearables", "electronics", "fitness"],
    sourceUrl: "https://www.aliexpress.com/item/10050012345678.html"
  },
  {
    id: "10050023456789",
    title: "SoundWave Mini Wireless Earbuds",
    description: "Immersive true wireless sound with Active Noise Cancelling (ANC), Bluetooth 5.3 chip, ergonomic snug fit, and 30-hour total charging case battery capacity.",
    rawPrice: 14.99,
    imageUrl: "https://picsum.photos/id/48/500/500",
    additionalImages: [
      "https://picsum.photos/id/39/500/500"
    ],
    options: [
      { name: "Color", values: ["Matte Black", "Glossy White"] }
    ],
    variants: [
      { sku: "SWM-BLK", combination: { Color: "Matte Black" }, price: 14.99, inventory: 200 },
      { sku: "SWM-WHT", combination: { Color: "Glossy White" }, price: 15.99, inventory: 150 }
    ],
    tags: ["earbuds", "audio", "sound", "electronics"],
    sourceUrl: "https://www.aliexpress.com/item/10050023456789.html"
  },
  {
    id: "10050034567890",
    title: "ErgoType Split Mechanical Keyboard",
    description: "Compact 75% mechanical keyboard designed with an ergonomic layout, hot-swappable tactile switches, dynamic RGB backlights, and dual-mode wireless connectivity.",
    rawPrice: 49.99,
    imageUrl: "https://picsum.photos/id/60/500/500",
    additionalImages: [
      "https://picsum.photos/id/64/500/500"
    ],
    options: [
      { name: "Switch Type", values: ["Brown Tactile", "Red Linear", "Blue Clicky"] }
    ],
    variants: [
      { sku: "ETK-BRW", combination: { "Switch Type": "Brown Tactile" }, price: 49.99, inventory: 45 },
      { sku: "ETK-RED", combination: { "Switch Type": "Red Linear" }, price: 49.99, inventory: 60 },
      { sku: "ETK-BLU", combination: { "Switch Type": "Blue Clicky" }, price: 47.99, inventory: 25 }
    ],
    tags: ["keyboard", "ergonomic", "accessories", "gaming"],
    sourceUrl: "https://www.aliexpress.com/item/10050034567890.html"
  }
];

// Helper to parse Aliexpress URL to ID
export function parseProductUrl(url: string): string | null {
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/\/item\/(\d+)\.html/);
  if (match) return match[1];
  
  // Also match pure numeric strings
  if (/^\d+$/.test(cleanUrl)) return cleanUrl;
  return null;
}

// 2. Fetch/Import Product Mock Implementation (Deterministic Faker Seeded Generation)
export function mockImportAliExpressProduct(urlOrId: string): AliExpressProduct {
  const id = parseProductUrl(urlOrId);
  if (!id) {
    throw new Error("Invalid AliExpress Product URL or ID format.");
  }

  // Return static mock product if preloaded
  const staticProduct = MOCK_PRODUCTS.find(p => p.id === id);
  if (staticProduct) return staticProduct;

  // Otherwise, deterministically generate a product using numeric ID as seed
  const numericSeed = parseInt(id.slice(-8)) || 99999;
  faker.seed(numericSeed);

  const rawPrice = parseFloat(faker.commerce.price({ min: 5, max: 99 }));
  const colors = [faker.color.human(), faker.color.human()];
  const sizes = ["M", "L", "XL"];

  const options: AliExpressProductOption[] = [
    { name: "Color", values: colors },
    { name: "Size", values: sizes }
  ];

  const variants: AliExpressVariant[] = [];
  colors.forEach((color) => {
    sizes.forEach((size) => {
      const optionAddon = color.charCodeAt(0) % 5; // deterministic pricing variation
      variants.push({
        sku: `MOCK-${id.substring(0, 5)}-${color.toUpperCase().substring(0, 3)}-${size}`,
        combination: { Color: color, Size: size },
        price: parseFloat((rawPrice + optionAddon).toFixed(2)),
        inventory: faker.number.int({ min: 10, max: 120 })
      });
    });
  });

  return {
    id,
    title: `Premium Mock ${faker.commerce.productName()}`,
    description: `Deterministically generated mock product description for ID ${id}. High quality, affordable, and durable. ${faker.lorem.paragraph()}`,
    rawPrice,
    imageUrl: `https://picsum.photos/id/${(numericSeed % 100) + 10}/500/500`,
    additionalImages: [
      `https://picsum.photos/id/${(numericSeed % 100) + 11}/500/500`,
      `https://picsum.photos/id/${(numericSeed % 100) + 12}/500/500`
    ],
    options,
    variants,
    tags: [faker.commerce.department().toLowerCase(), "imported"],
    sourceUrl: `https://www.aliexpress.com/item/${id}.html`
  };
}

// 3. Keyword Search Mock Implementation
export function mockSearchAliExpress(keyword: string, limit = 10, offset = 0) {
  const query = keyword.toLowerCase().trim();
  
  // Filter predefined mock products
  let results = MOCK_PRODUCTS.filter(p => 
    p.title.toLowerCase().includes(query) || 
    p.tags.some(tag => tag.toLowerCase().includes(query))
  );

  // If no predefined item matches, generate 4 deterministic search results
  if (results.length === 0 && query.length > 0) {
    const stringSum = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < 4; i++) {
      const generatedId = String(10050090000000 + stringSum + i);
      results.push(mockImportAliExpressProduct(generatedId));
    }
  }

  return {
    products: results.slice(offset, offset + limit),
    total: results.length
  };
}
```

### 4.4 Recommended Auth Config: `src/lib/auth.ts`

Configure the Drizzle SQLite adapter explicitly mapping to user schemas:

```typescript
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/index.ts'
import * as schema from '../db/schema.ts'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    // Add additional roles column for admin validation in M3
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false, // Prevents user from registering themselves as admin
      },
    },
  },
  plugins: [tanstackStartCookies()],
})
```

---

## 5. Verification Method

To verify the schemas and client setup independently, follow these methods:

### 5.1 Migration & DB Schema Verification
Run the Drizzle commands to compile and verify schemas:
```bash
# 1. Generate migrations SQL (Checks schema files syntax and generates files in /drizzle)
npx drizzle-kit generate

# 2. Push/migrate database changes to a local SQLite schema test file (e.g. test.db)
DATABASE_URL="file:test.db" npx drizzle-kit push
```

### 5.2 Unit Test suite (Vitest)
Create a test file `src/lib/__tests__/milestone1.test.ts` to verify the logic:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '../db/schema.ts'
import { calculateRetailPrice, formatUSD } from '../pricing.ts'
import { mockImportAliExpressProduct, mockSearchAliExpress, parseProductUrl } from '../aliexpress-mock.ts'

describe('Milestone 1 Unit Tests', () => {
  
  describe('Database Operations (In-Memory SQLite)', () => {
    let testDb: any;
    
    beforeEach(() => {
      // Create a clean in-memory sqlite client for testing
      const sqlite = new Database(':memory:')
      testDb = drizzle(sqlite, { schema })
      
      // Seed tables
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          emailVerified INTEGER NOT NULL,
          image TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          role TEXT NOT NULL DEFAULT 'user'
        );
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          markupType TEXT NOT NULL DEFAULT 'multiplier',
          fixedMarkup INTEGER NOT NULL DEFAULT 0,
          marginMultiplier REAL NOT NULL DEFAULT 1.0
        );
      `)
    })

    it('should insert and verify custom settings rules', async () => {
      // Try setting a multiplier markup
      await testDb.insert(schema.settings).values({
        id: 1,
        markupType: 'multiplier',
        marginMultiplier: 1.5,
      }).onConflictDoUpdate({
        target: schema.settings.id,
        set: { markupType: 'multiplier', marginMultiplier: 1.5 }
      })

      const rows = await testDb.select().from(schema.settings)
      expect(rows[0].marginMultiplier).toBe(1.5)
      expect(rows[0].markupType).toBe('multiplier')
    })
  })

  describe('Pricing helper operations', () => {
    it('should correctly apply a fixed markup to cents price', () => {
      const price = calculateRetailPrice(
        1099, // $10.99 base price
        { markupType: 'fixed', fixedMarkup: 500, marginMultiplier: 1.0 } // +$5.00
      )
      expect(price).toBe(1599) // $15.99
      expect(formatUSD(price)).toBe('$15.99')
    })

    it('should correctly apply a multiplier markup to cents price', () => {
      const price = calculateRetailPrice(
        1000, // $10.00 base price
        { markupType: 'multiplier', fixedMarkup: 0, marginMultiplier: 1.35 } // 35% margin
      )
      expect(price).toBe(1350) // $13.50
    })

    it('should support product-level custom overrides', () => {
      const price = calculateRetailPrice(
        1000, 
        { markupType: 'multiplier', fixedMarkup: 0, marginMultiplier: 1.5 },
        'fixed', // product override type
        200      // product override value (+$2.00)
      )
      expect(price).toBe(1200) // $12.00 instead of $15.00
    })
  })

  describe('AliExpress Mock Client', () => {
    it('should parse product URL to extract product ID', () => {
      const id = parseProductUrl('https://www.aliexpress.com/item/10050012345678.html?spm=123')
      expect(id).toBe('10050012345678')
    })

    it('should import predefined products by URL', () => {
      const product = mockImportAliExpressProduct('https://www.aliexpress.com/item/10050012345678.html')
      expect(product.title).toBe('UltraFit Smartwatch Series 9')
      expect(product.variants.length).toBe(6)
    })

    it('should generate deterministic mock products for arbitrary IDs', () => {
      const product1 = mockImportAliExpressProduct('https://www.aliexpress.com/item/10050098765432.html')
      const product2 = mockImportAliExpressProduct('10050098765432')
      
      expect(product1.id).toBe('10050098765432')
      expect(product1.title).toBe(product2.title)
      expect(product1.rawPrice).toBe(product2.rawPrice)
      expect(product1.variants[0].sku).toBe(product2.variants[0].sku)
    })

    it('should find items by matching keyword', () => {
      const searchRes = mockSearchAliExpress('smartwatch')
      expect(searchRes.products[0].title).toBe('UltraFit Smartwatch Series 9')
    })
  })
})
```

Run test suite command:
```bash
# Verify vitest execution of tests (packages must be installed via `npm i` or `pnpm i` first)
npx vitest run
```
