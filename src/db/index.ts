import * as schema from './schema'

let db: any

const isCloudflare = typeof globalThis !== 'undefined' && ('WebSocketPair' in globalThis || 'caches' in globalThis)

if (isCloudflare) {
  // Cloudflare Environment: SQLite Proxy backed by a Durable Object
  const { drizzle } = await import('drizzle-orm/sqlite-proxy')
  
  // Hide import from Vite static analysis using a variable path (resolves at worker runtime only)
  const workerModuleName = 'cloudflare:workers'
  const { env } = await import(workerModuleName) as any

  db = drizzle(async (sql, params, method) => {
    try {
      const id = env.DB_DO.idFromName('main_database')
      const stub = env.DB_DO.get(id)
      const res = await stub.fetch('http://do/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params, method })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Durable Object SQL Error: ${errText}`)
      }
      return await res.json()
    } catch (err: any) {
      console.error('Durable Object Database Query Error:', err)
      return { rows: [] }
    }
  }, { schema })
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
