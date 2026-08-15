import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

export type DatabaseClient =
  | BetterSQLite3Database<typeof schema>
  | DrizzleD1Database<typeof schema>
  | BunSQLiteDatabase<typeof schema>

interface CloudflareWorkersEnv {
  DB?: unknown
}

let db!: DatabaseClient

const isCloudflare = typeof globalThis !== 'undefined' && ('WebSocketPair' in globalThis || 'caches' in globalThis)
const isBun = typeof process !== 'undefined' && Boolean(process.versions?.bun)

if (isCloudflare) {
  try {
    const d1Module = 'drizzle-orm/d1'
    const { drizzle } = (await import(/* @vite-ignore */ d1Module)) as { drizzle: (db: unknown, opt: { schema: typeof schema }) => DrizzleD1Database<typeof schema> }
    const cfWorkersModule = 'cloudflare:workers'
    const { env } = (await import(/* @vite-ignore */ cfWorkersModule)) as { env?: CloudflareWorkersEnv }
    if (env && env.DB) {
      db = drizzle(env.DB, { schema })
    }
  } catch {
    // Handled in Cloudflare runtime
  }
} else if (isBun) {
  try {
    const bunSqliteModule = 'bun:sqlite'
    const bunDrizzleModule = 'drizzle-orm/bun-sqlite'
    const { Database } = (await import(/* @vite-ignore */ bunSqliteModule)) as { Database: new (path: string) => unknown }
    const { drizzle } = (await import(/* @vite-ignore */ bunDrizzleModule)) as { drizzle: (db: unknown, opt: { schema: typeof schema }) => BunSQLiteDatabase<typeof schema> }
    const sqlite = new Database('sqlite.db')
    db = drizzle(sqlite, { schema })
  } catch {
    // Handled in Bun runtime
  }
} else {
  try {
    const betterSqliteModule = 'better-sqlite3'
    const betterDrizzleModule = 'drizzle-orm/better-sqlite3'
    const { default: Database } = (await import(/* @vite-ignore */ betterSqliteModule)) as { default: new (path: string) => unknown }
    const { drizzle } = (await import(/* @vite-ignore */ betterDrizzleModule)) as { drizzle: (db: unknown, opt: { schema: typeof schema }) => BetterSQLite3Database<typeof schema> }
    const sqlite = new Database('sqlite.db')
    db = drizzle(sqlite, { schema })
  } catch {
    // Handled in Node/testing environments
  }
}

export { db }
export * from './schema'

