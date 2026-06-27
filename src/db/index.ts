import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Create database connection pointing to the sqlite.db at the project root
const sqlite = new Database('sqlite.db')

export const db = drizzle(sqlite, { schema })
export type DatabaseClient = typeof db
export * from './schema'
