/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { importAliExpressProductHandler } from '../lib/scraperSession'
import { getSettingsHandler, updateSettingsHandler } from '../lib/settingsSession'
import { db } from './index'

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

describe('AliExpress Product Scraper Security Boundaries & Markups', () => {
  test('should fail to import a product when no active session is found (unauthorized)', async () => {
    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/100500123456.html' },
      { session: null }
    )

    expect(result).toBeDefined()
    expect(result.error).toContain('UNAUTHORIZED')
  })

  test('should reject invalid AliExpress product URL scheme', async () => {
    const mockSession = {
      session: {
        id: 'session-id',
        userId: 'user-id',
        token: 'token',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: 'user-id',
        email: 'admin@dstrkt.com',
        name: 'Admin User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    const result = await importAliExpressProductHandler(
      { url: 'ftp://aliexpress.com/item/123.html' },
      { session: mockSession }
    )
    expect(result.error).toContain('INVALID SCHEME')

    const nonAliExpress = await importAliExpressProductHandler(
      { url: 'https://amazon.com/item/123.html' },
      { session: mockSession }
    )
    expect(nonAliExpress.error).toContain('UNRECOGNIZED BLOCKCHAIN ADAPTER')
  })

  test('should successfully import product with session, apply settings markup fallback, validate and insert', async () => {
    const mockSession = {
      session: {
        id: 'session-id',
        userId: 'user-id',
        token: 'token',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: 'user-id',
        email: 'admin@dstrkt.com',
        name: 'Admin User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Mock db.select().from().where().get() to return null so it falls back to 1.5 multiplier
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(null)
        })
      })
    } as any)

    // Mock db.insert().values() to mock successful database insertion
    const insertSpy = vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({} as any)
    } as any)

    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/jacket-cyber.html' },
      { session: mockSession }
    )

    expect(result.success).toBe(true)
    expect(result.productId).toBeDefined()
    expect(result.product?.title).toBe('AliExpress Stealth Cybertech Jacket')
    // 120 (raw) * 1.5 (default markup) = 180
    expect(result.product?.finalPrice).toBe(180)
    expect(result.product?.multiplier).toBe(1.5)

    expect(insertSpy).toHaveBeenCalled()

    selectSpy.mockRestore()
    insertSpy.mockRestore()
  })

  test('should successfully import product using custom database markup multiplier setting', async () => {
    const mockSession = {
      session: {
        id: 'session-id',
        userId: 'user-id',
        token: 'token',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: 'user-id',
        email: 'admin@dstrkt.com',
        name: 'Admin User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Mock db.select().from().where().get() to return 2.0 multiplier
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'markup_multiplier',
            marginMultiplier: 2.0
          })
        })
      })
    } as any)

    // Mock db.insert().values()
    const insertSpy = vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({} as any)
    } as any)

    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/shoes-tactical.html' },
      { session: mockSession }
    )

    expect(result.success).toBe(true)
    expect(result.product?.title).toBe('AliExpress S-05 Matrix Boots')
    // 150 (raw) * 2.0 (custom markup) = 300
    expect(result.product?.finalPrice).toBe(300)
    expect(result.product?.multiplier).toBe(2.0)

    selectSpy.mockRestore()
    insertSpy.mockRestore()
  })
})


describe('Global Settings Control & DB Synchronization', () => {
  const mockAdminSession = {
    session: {
      id: 'session-id',
      userId: 'user-id',
      token: 'token',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: 'user-id',
      email: 'admin@dstrkt.com',
      name: 'Admin User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  const mockNonAdminSession = {
    session: {
      id: 'session-id-2',
      userId: 'user-id-2',
      token: 'token-2',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: 'user-id-2',
      email: 'user@dstrkt.com',
      name: 'Regular User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  test('should fail to retrieve settings when unauthorized (non-admin / no session)', async () => {
    await expect(getSettingsHandler({ session: null })).rejects.toThrow('UNAUTHORIZED')
    await expect(getSettingsHandler({ session: mockNonAdminSession })).rejects.toThrow('UNAUTHORIZED')
  })

  test('should retrieve default multiplier settings if not found in db for admin', async () => {
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(null)
        })
      })
    } as any)

    const result = await getSettingsHandler({ session: mockAdminSession })
    expect(result).toBeDefined()
    expect(result.marginMultiplier).toBe(1.5)
    expect(result.markupType).toBe('multiplier')

    selectSpy.mockRestore()
  })

  test('should successfully retrieve existing settings when found in db for admin', async () => {
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'markup_multiplier',
            markupType: 'multiplier',
            fixedMarkup: 0.0,
            marginMultiplier: 2.5,
            updatedAt: 12345
          })
        })
      })
    } as any)

    const result = await getSettingsHandler({ session: mockAdminSession })
    expect(result).toBeDefined()
    expect(result.marginMultiplier).toBe(2.5)

    selectSpy.mockRestore()
  })

  test('should fail to update settings when unauthorized', async () => {
    const res1 = await updateSettingsHandler({ marginMultiplier: 1.8 }, { session: null })
    expect(res1.error).toContain('UNAUTHORIZED')

    const res2 = await updateSettingsHandler({ marginMultiplier: 1.8 }, { session: mockNonAdminSession })
    expect(res2.error).toContain('UNAUTHORIZED')
  })

  test('should reject negative multipliers during update', async () => {
    const res = await updateSettingsHandler({ marginMultiplier: -1.0 }, { session: mockAdminSession })
    expect(res.error).toContain('INVALID_VALUE')
  })

  test('should successfully insert settings in database for admin when none exists', async () => {
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(null)
        })
      })
    } as any)

    const insertSpy = vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({} as any)
    } as any)

    const res = await updateSettingsHandler({ marginMultiplier: 1.85 }, { session: mockAdminSession })
    expect(res.success).toBe(true)
    expect(insertSpy).toHaveBeenCalled()

    selectSpy.mockRestore()
    insertSpy.mockRestore()
  })

  test('should successfully update settings in database for admin when they exist', async () => {
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'markup_multiplier',
            marginMultiplier: 1.5
          })
        })
      })
    } as any)

    const updateSpy = vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({} as any)
      })
    } as any)

    const res = await updateSettingsHandler({ marginMultiplier: 2.15 }, { session: mockAdminSession })
    expect(res.success).toBe(true)
    expect(updateSpy).toHaveBeenCalled()

    selectSpy.mockRestore()
    updateSpy.mockRestore()
  })
})
