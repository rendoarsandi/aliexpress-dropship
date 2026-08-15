import { describe, test, expect, vi } from 'vitest'

// Mock better-sqlite3 to bypass native compilation binding limitations on Termux
vi.mock('better-sqlite3', () => {
  const DatabaseMock = function (this: Record<string, unknown>) {
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
import { importAliExpressProductHandler } from '../lib/scraperSession.server'
import { getSettingsHandler, updateSettingsHandler, getSettingsEffect, updateSettingsEffect } from '../lib/settingsSession.server'
import { settingsRepository } from './repositories/settingsRepository'
import { productRepository } from './repositories/productRepository'
import { Effect } from 'effect'

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

  test('should verify better-auth integration is configured correctly with email and Google social provider', () => {
    expect(auth).toBeDefined()
    expect(auth.options).toBeDefined()
    expect(auth.options.database).toBeDefined()
    expect(auth.options.emailAndPassword).toBeDefined()
    expect(auth.options.emailAndPassword?.enabled).toBe(true)

    // Verify Google provider config
    expect(auth.options.socialProviders).toBeDefined()
    expect(auth.options.socialProviders?.google).toBeDefined()
    expect(auth.options.socialProviders?.google?.clientId).toBeDefined()
    expect(auth.options.socialProviders?.google?.clientSecret).toBeDefined()
  })
})

describe('AliExpress Product Scraper Security Boundaries & Markups', () => {
  test('should fail to import a product when no active session is found (unauthorized)', async () => {
    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/100500123456.html' },
      { session: null }
    )

    expect(result).toBeDefined()
    if ('error' in result) {
      expect(result.error).toContain('UNAUTHORIZED')
    } else {
      expect.fail('Expected unauthorized error')
    }
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
    if ('error' in result) {
      expect(result.error).toContain('INVALID SCHEME')
    } else {
      expect.fail('Expected invalid scheme error')
    }

    const nonAliExpress = await importAliExpressProductHandler(
      { url: 'https://amazon.com/item/123.html' },
      { session: mockSession }
    )
    if ('error' in nonAliExpress) {
      expect(nonAliExpress.error).toContain('UNRECOGNIZED BLOCKCHAIN ADAPTER')
    } else {
      expect.fail('Expected unrecognized adapter error')
    }
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

    // Mock settingsRepository.getSettings to return null so it falls back to 1.5 multiplier
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue(null)
    const insertProductSpy = vi.spyOn(productRepository, 'insertProduct').mockResolvedValue(undefined)

    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/jacket-cyber.html' },
      { session: mockSession }
    )

    if ('success' in result) {
      expect(result.success).toBe(true)
      expect(result.productId).toBeDefined()
      expect(result.product?.title).toBe('AliExpress Stealth Cybertech Jacket')
      // 120 (raw) * 1.5 (default markup) = 180
      expect(result.product?.finalPrice).toBe(180)
      expect(result.product?.multiplier).toBe(1.5)
    } else {
      expect.fail('Expected successful import')
    }

    expect(insertProductSpy).toHaveBeenCalled()

    getSettingsSpy.mockRestore()
    insertProductSpy.mockRestore()
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

    // Mock settingsRepository.getSettings to return 2.0 multiplier
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue({
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier: 2.0,
      updatedAt: Date.now()
    })
    const insertProductSpy = vi.spyOn(productRepository, 'insertProduct').mockResolvedValue(undefined)

    const result = await importAliExpressProductHandler(
      { url: 'https://aliexpress.com/item/shoes-tactical.html' },
      { session: mockSession }
    )

    if ('success' in result) {
      expect(result.success).toBe(true)
      expect(result.product?.title).toBe('AliExpress S-05 Matrix Boots')
      // 150 (raw) * 2.0 (custom markup) = 300
      expect(result.product?.finalPrice).toBe(300)
      expect(result.product?.multiplier).toBe(2.0)
    } else {
      expect.fail('Expected successful import')
    }

    getSettingsSpy.mockRestore()
    insertProductSpy.mockRestore()
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
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue(null)

    const result = await getSettingsHandler({ session: mockAdminSession })
    expect(result).toBeDefined()
    expect(result.marginMultiplier).toBe(1.5)
    expect(result.markupType).toBe('multiplier')

    getSettingsSpy.mockRestore()
  })

  test('should successfully retrieve existing settings when found in db for admin', async () => {
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue({
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier: 2.5,
      updatedAt: 12345
    })

    const result = await getSettingsHandler({ session: mockAdminSession })
    expect(result).toBeDefined()
    expect(result.marginMultiplier).toBe(2.5)

    getSettingsSpy.mockRestore()
  })

  test('should fail to update settings when unauthorized', async () => {
    const res1 = await updateSettingsHandler({ marginMultiplier: 1.8 }, { session: null })
    if ('error' in res1) {
      expect(res1.error).toContain('UNAUTHORIZED')
    } else {
      expect.fail('Expected unauthorized error')
    }

    const res2 = await updateSettingsHandler({ marginMultiplier: 1.8 }, { session: mockNonAdminSession })
    if ('error' in res2) {
      expect(res2.error).toContain('UNAUTHORIZED')
    } else {
      expect.fail('Expected unauthorized error')
    }
  })

  test('should reject negative multipliers during update', async () => {
    const res = await updateSettingsHandler({ marginMultiplier: -1.0 }, { session: mockAdminSession })
    if ('error' in res) {
      expect(res.error).toContain('INVALID_VALUE')
    } else {
      expect.fail('Expected invalid value error')
    }
  })

  test('should successfully insert settings in database for admin when none exists', async () => {
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue(null)
    const insertSettingsSpy = vi.spyOn(settingsRepository, 'insertSettings').mockResolvedValue(undefined)

    const res = await updateSettingsHandler({ marginMultiplier: 1.85 }, { session: mockAdminSession })
    if ('success' in res) {
      expect(res.success).toBe(true)
    } else {
      expect.fail('Expected success')
    }
    expect(insertSettingsSpy).toHaveBeenCalledWith(1.85)

    getSettingsSpy.mockRestore()
    insertSettingsSpy.mockRestore()
  })

  test('should successfully update settings in database for admin when they exist', async () => {
    const getSettingsSpy = vi.spyOn(settingsRepository, 'getSettings').mockResolvedValue({
      id: 'markup_multiplier',
      markupType: 'multiplier',
      fixedMarkup: 0.0,
      marginMultiplier: 1.5,
      updatedAt: 1000
    })
    const updateSettingsSpy = vi.spyOn(settingsRepository, 'updateSettings').mockResolvedValue(undefined)

    const res = await updateSettingsHandler({ marginMultiplier: 2.15 }, { session: mockAdminSession })
    if ('success' in res) {
      expect(res.success).toBe(true)
    } else {
      expect.fail('Expected success')
    }
    expect(updateSettingsSpy).toHaveBeenCalledWith(2.15)

    getSettingsSpy.mockRestore()
    updateSettingsSpy.mockRestore()
  })
})

describe('Effect-TS Pure Functional Pipelines', () => {
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

  test('getSettingsEffect fails with UnauthorizedError when session is non-admin', async () => {
    const result = await Effect.runPromiseExit(getSettingsEffect({ session: mockNonAdminSession }))
    expect(result._tag).toBe('Failure')
    if (result._tag === 'Failure') {
      const cause = result.cause
      expect(cause._tag).toBe('Fail')
      if ('error' in cause && typeof cause.error === 'object' && cause.error !== null && '_tag' in cause.error) {
        expect((cause.error as { _tag: string })._tag).toBe('UnauthorizedError')
      }
    }
  })

  test('updateSettingsEffect fails with InvalidValueError for negative multipliers', async () => {
    const result = await Effect.runPromiseExit(updateSettingsEffect({ marginMultiplier: -1.5 }, { session: mockAdminSession }))
    expect(result._tag).toBe('Failure')
    if (result._tag === 'Failure') {
      const cause = result.cause
      expect(cause._tag).toBe('Fail')
      if ('error' in cause && typeof cause.error === 'object' && cause.error !== null && '_tag' in cause.error) {
        expect((cause.error as { _tag: string })._tag).toBe('InvalidValueError')
      }
    }
  })
})

