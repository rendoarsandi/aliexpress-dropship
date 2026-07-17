/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock react-start server functions to run directly in Vitest without AsyncLocalStorage context
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

const mockStripeCreate = vi.fn()
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(function (this: any) {
    this.checkout = {
      sessions: {
        create: mockStripeCreate
      }
    }
  })
  return {
    default: MockStripe
  }
})

import { createCheckoutSessionFn } from './stripeSession'
import { createStripeCheckoutSessionFn } from './stripe'

describe('Stripe Checkout Session Server Functions', () => {
  const originalEnv = { ...process.env }
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    globalThis.fetch = originalFetch
  })

  describe('createCheckoutSessionFn (Simple/Legacy Session creator)', () => {
    test('returns simulated mock fallback when STRIPE_SECRET_KEY is not defined', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const payload = {
        email: 'customer@example.com',
        items: [
          { name: 'DSTRKT Jacket', price: 120, quantity: 1 }
        ],
        origin: 'http://localhost:3000'
      }

      const result = await createCheckoutSessionFn({ data: payload })
      expect(result).toBeDefined()
      expect(result.simulated).toBe(true)
      expect(result.url).toBeNull()
    })

    test('calls Stripe SDK to create checkout session when STRIPE_SECRET_KEY is defined', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_legacy'

      // Mock Stripe SDK
      mockStripeCreate.mockResolvedValueOnce({
        url: 'https://checkout.stripe.com/pay/cs_test_legacy_123'
      })

      const payload = {
        email: 'customer@example.com',
        items: [
          { name: 'DSTRKT Jacket', price: 120, quantity: 2 }
        ],
        origin: 'http://localhost:3000'
      }

      const result = await createCheckoutSessionFn({ data: payload })
      expect(result).toBeDefined()
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_legacy_123')
      expect(mockStripeCreate).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'DSTRKT Jacket' },
              unit_amount: 12000
            },
            quantity: 2
          }
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000/orders?success=true&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/cart?cancelled=true',
        customer_email: 'customer@example.com'
      })
    })
  })

  describe('createStripeCheckoutSessionFn (Schema-Validated & API-Direct Creator)', () => {
    const validPayload = {
      email: 'user@dstrkt.com',
      fullName: 'John Doe',
      nodeAddress: '0x1234567890abcdef',
      walletId: 'wallet_dstrkt_01',
      items: [
        {
          productId: 'prod-01',
          name: 'Cybertech Cargo Pants',
          quantity: 2,
          price: 240.00,
          options: { size: '32', color: 'Black' }
        }
      ]
    }

    test('should validate input with @effect/schema and reject invalid email formats', async () => {
      const invalidPayload = {
        ...validPayload,
        email: 'invalid-email-address'
      }

      await expect(
        createStripeCheckoutSessionFn({ data: invalidPayload })
      ).rejects.toThrow()
    })

    test('should validate input and reject empty fullName', async () => {
      const invalidPayload = {
        ...validPayload,
        fullName: ''
      }

      await expect(
        createStripeCheckoutSessionFn({ data: invalidPayload })
      ).rejects.toThrow()
    })

    test('should validate input and reject negative quantities or prices', async () => {
      const invalidQuantity = {
        ...validPayload,
        items: [
          {
            ...validPayload.items[0],
            quantity: 0
          }
        ]
      }

      const invalidPrice = {
        ...validPayload,
        items: [
          {
            ...validPayload.items[0],
            price: -50.00
          }
        ]
      }

      await expect(
        createStripeCheckoutSessionFn({ data: invalidQuantity })
      ).rejects.toThrow()

      await expect(
        createStripeCheckoutSessionFn({ data: invalidPrice })
      ).rejects.toThrow()
    })

    test('returns mock URL when STRIPE_SECRET_KEY is not defined (simulation fallback)', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const result = await createStripeCheckoutSessionFn({ data: validPayload })
      expect(result).toBeDefined()
      expect(result.mock).toBe(true)
      expect(result.sessionId).toBeDefined()
      expect(result.url).toContain('/checkout?success=true')
      expect(result.url).toContain('email=user%40dstrkt.com')
      expect(result.url).toContain('name=John%20Doe')
    })

    test('queries Stripe API directly via REST and returns session URL when STRIPE_SECRET_KEY is defined', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_direct_api'
      process.env.BETTER_AUTH_URL = 'https://dstrkt.com'

      const mockResponse = {
        url: 'https://checkout.stripe.com/pay/cs_test_direct_999'
      }

      // Mock native fetch
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      globalThis.fetch = fetchSpy

      const result = await createStripeCheckoutSessionFn({ data: validPayload })

      expect(result).toBeDefined()
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_direct_999')
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe('https://api.stripe.com/v1/checkout/sessions')
      expect(init.method).toBe('POST')
      expect(init.headers.Authorization).toBe('Bearer sk_test_direct_api')
      expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

      // Verify request body content
      const body = init.body
      expect(body).toContain('mode=payment')
      expect(body).toContain('success_url=https%3A%2F%2Fdstrkt.com%2Fcheckout%3Fsuccess%3Dtrue%26session_id%3D%7BCHECKOUT_SESSION_ID%7D')
      expect(body).toContain('cancel_url=https%3A%2F%2Fdstrkt.com%2Fcart')
      expect(body).toContain('customer_email=user%40dstrkt.com')
      expect(body).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bcurrency%5D=usd')
      expect(body).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bproduct_data%5D%5Bname%5D=Cybertech+Cargo+Pants')
      expect(body).toContain('line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=24000')
      expect(body).toContain('line_items%5B0%5D%5Bquantity%5D=2')
    })

    test('falls back gracefully to mock session when Stripe REST API responds with error', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_direct_api'

      // Mock native fetch failing
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => 'Stripe account is restricted'
      })
      globalThis.fetch = fetchSpy

      const result = await createStripeCheckoutSessionFn({ data: validPayload })

      expect(result).toBeDefined()
      expect(result.mock).toBe(true)
      expect(result.sessionId).toBeDefined()
      expect(result.url).toContain('/checkout?success=true')
    })
  })
})
