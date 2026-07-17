/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock react-start server functions to run directly in Vitest
vi.mock('@tanstack/react-start', () => {
  const createServerFn = () => {
    let validatorFn = (data: any) => data
    let handlerFn = (ctx: any) => ctx

    const fn = async (input: any) => {
      const validated = validatorFn(input ? input.data : undefined)
      return handlerFn({ data: validated })
    }

    fn.validator = (val: any) => {
      validatorFn = val
      return fn
    }

    fn.handler = (hand: any) => {
      handlerFn = hand
      return fn
    }

    return fn
  }

  return {
    createServerFn
  }
})

// Mock handlers to avoid DB/network overhead
vi.mock('./scraperSession.server', () => ({
  importAliExpressProductHandler: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('./settingsSession.server', () => ({
  getSettingsHandler: vi.fn().mockResolvedValue({ marginMultiplier: 1.5 }),
  updateSettingsHandler: vi.fn().mockResolvedValue({ success: true })
}))

import { importAliExpressProductFn } from './scraperSession'
import { updateSettingsFn } from './settingsSession'
import { createCheckoutSessionFn } from './stripeSession'

describe('Server Functions Input Validation via @effect/schema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('importAliExpressProductFn', () => {
    test('rejects invalid URL patterns', async () => {
      await expect(
        importAliExpressProductFn({ data: { url: 'not-a-url' } })
      ).rejects.toThrow()

      await expect(
        importAliExpressProductFn({ data: { url: 'ftp://aliexpress.com/item' } })
      ).rejects.toThrow()
    })

    test('accepts valid HTTP/HTTPS URLs', async () => {
      const result = await importAliExpressProductFn({ data: { url: 'https://aliexpress.com/item/123.html' } })
      expect(result).toEqual({ success: true })
    })
  })

  describe('updateSettingsFn', () => {
    test('rejects negative or zero multipliers', async () => {
      await expect(
        updateSettingsFn({ data: { marginMultiplier: -1 } })
      ).rejects.toThrow()

      await expect(
        updateSettingsFn({ data: { marginMultiplier: 0 } })
      ).rejects.toThrow()
    })

    test('accepts valid positive numbers', async () => {
      const result = await updateSettingsFn({ data: { marginMultiplier: 1.8 } })
      expect(result).toEqual({ success: true })
    })
  })

  describe('createCheckoutSessionFn', () => {
    test('rejects invalid email address', async () => {
      const payload = {
        email: 'bad-email',
        items: [{ name: 'Item', price: 10, quantity: 1 }],
        origin: 'http://localhost:3000'
      }
      await expect(
        createCheckoutSessionFn({ data: payload })
      ).rejects.toThrow()
    })

    test('rejects empty item names', async () => {
      const payload = {
        email: 'test@example.com',
        items: [{ name: '', price: 10, quantity: 1 }],
        origin: 'http://localhost:3000'
      }
      await expect(
        createCheckoutSessionFn({ data: payload })
      ).rejects.toThrow()
    })

    test('rejects negative prices or zero quantities', async () => {
      const badPrice = {
        email: 'test@example.com',
        items: [{ name: 'Item', price: -5, quantity: 1 }],
        origin: 'http://localhost:3000'
      }
      const badQty = {
        email: 'test@example.com',
        items: [{ name: 'Item', price: 10, quantity: 0 }],
        origin: 'http://localhost:3000'
      }
      await expect(createCheckoutSessionFn({ data: badPrice })).rejects.toThrow()
      await expect(createCheckoutSessionFn({ data: badQty })).rejects.toThrow()
    })
  })
})
