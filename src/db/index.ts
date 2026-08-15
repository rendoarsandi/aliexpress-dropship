import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

export type DatabaseClient = BetterSQLite3Database<typeof schema> | DrizzleD1Database<typeof schema>

interface CloudflareWorkersEnv {
  DB?: unknown
}

let db: DatabaseClient = undefined as unknown as DatabaseClient

const isCloudflare = typeof globalThis !== 'undefined' && ('WebSocketPair' in globalThis || 'caches' in globalThis)

if (isCloudflare) {
  try {
    const { drizzle } = await import('drizzle-orm/d1')
    const cfWorkersModule = 'cloudflare:workers'
    const { env } = (await import(/* @vite-ignore */ cfWorkersModule)) as { env?: CloudflareWorkersEnv }
    if (env && env.DB) {
      const drizzleD1 = drizzle as (client: unknown, options: { schema: typeof schema }) => DrizzleD1Database<typeof schema>
      db = drizzleD1(env.DB, { schema })
    }
  } catch {
    // Handled in Cloudflare runtime
  }
} else {
  try {
    const { default: Database } = await import('better-sqlite3')
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const sqlite = new Database('sqlite.db')
    db = drizzle(sqlite, { schema })
  } catch {
    // Handled in Node/testing environments
  }
}

export { db }
export * from './schema'

