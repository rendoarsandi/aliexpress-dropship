import { describe, test, expect, vi } from 'vitest'

// Mock better-sqlite3 to bypass native compilation binding limitations on Termux
vi.mock('better-sqlite3', () => {
  const DatabaseMock = function (this: any) {
    this.exec = vi.fn()
    this.prepare = vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    })
  }
  return {
    default: DatabaseMock
  }
})

import * as schema from './schema'
import { auth } from '../lib/auth'

describe('DSTRKT Database Schema & Authentication Integration', () => {
  test('should verify database tables are correctly defined in schema', () => {
    // Verify core e-commerce tables exist
    expect(schema.products).toBeDefined()
    expect(schema.orders).toBeDefined()
    expect(schema.settings).toBeDefined()

    // Verify auth tables exist
    expect(schema.user).toBeDefined()
    expect(schema.session).toBeDefined()
    expect(schema.account).toBeDefined()
    expect(schema.verification).toBeDefined()
  })

  test('should verify product schema has the correct column structure', () => {
    const productFields = schema.products
    expect(productFields.id).toBeDefined()
    expect(productFields.title).toBeDefined()
    expect(productFields.rawPrice).toBeDefined()
    expect(productFields.imageUrl).toBeDefined()
  })

  test('should verify better-auth integration is configured correctly', () => {
    expect(auth).toBeDefined()
    expect(auth.options).toBeDefined()
    expect(auth.options.database).toBeDefined()
    expect(auth.options.emailAndPassword).toBeDefined()
    expect(auth.options.emailAndPassword?.enabled).toBe(true)
  })
})
