/* eslint-disable */
// @ts-nocheck
import { DurableObject } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/durable-sqlite'
import * as schema from './schema'

export class DatabaseDO extends DurableObject {
  db: any

  constructor(state: DurableObjectState, env: any) {
    super(state, env)
    this.db = drizzle(state.storage, { schema })
  }

  async fetch(request: Request) {
    const url = new URL(request.url)
    if (url.pathname === '/query') {
      try {
        const { sql, params, method } = await request.json() as { sql: string; params: any[]; method: string }

        let result: any
        if (method === 'run') {
          this.ctx.storage.sql.exec(sql, ...params)
          return new Response(JSON.stringify({ rows: [] }), {
            headers: { 'Content-Type': 'application/json' }
          })
        } else {
          const rows = this.ctx.storage.sql.exec(sql, ...params).toArray()
          return new Response(JSON.stringify({ rows }), {
            headers: { 'Content-Type': 'application/json' }
          })
        }
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    return new Response('Not Found', { status: 404 })
  }
}
