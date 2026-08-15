import * as schema from './schema'

let db: any

const isCloudflare = typeof globalThis !== 'undefined' && ('WebSocketPair' in globalThis || 'caches' in globalThis)

if (isCloudflare) {
  try {
    const { drizzle } = await import('drizzle-orm/d1')
    const cfWorkersModule = 'cloudflare:workers'
    const { env } = (await import(/* @vite-ignore */ cfWorkersModule)) as any
    if (env && env.DB) {
      db = drizzle(env.DB, { schema })
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
export type DatabaseClient = typeof db
export * from './schema'

