import * as schema from './schema'

let db: any

const isCloudflare = typeof globalThis !== 'undefined' && ('WebSocketPair' in globalThis || 'caches' in globalThis)

if (isCloudflare) {
  // Cloudflare Environment: Cloudflare D1 Database
  const { drizzle } = await import('drizzle-orm/d1')
  
  // Hide import from Vite static analysis using a variable path (resolves at worker runtime only)
  const workerModuleName = 'cloudflare:workers'
  const { env } = await import(workerModuleName) as any

  db = drizzle(env.DB, { schema })
} else {
  // Local Node.js / Testing Environment: Native better-sqlite3 database
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  const sqlite = new Database('sqlite.db')
  db = drizzle(sqlite, { schema })
}

export { db }
export type DatabaseClient = typeof db
export * from './schema'
