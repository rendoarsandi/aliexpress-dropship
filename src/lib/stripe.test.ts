import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

type ValidatorFn<TInput = unknown, TOutput = unknown> = (data: TInput) => TOutput
type HandlerFn<TData = unknown, TResult = unknown> = (ctx: { data: TData }) => Promise<TResult> | TResult

// Mock react-start server functions to run directly in Vitest without AsyncLocalStorage context
vi.mock('@tanstack/react-start', () => {
  const createServerFn = () => {
    let validatorFn: ValidatorFn = (data: unknown) => data
    let handlerFn: HandlerFn = (ctx: { data: unknown }) => ctx

    const fn = async (input: { data: unknown }) => {
      const validated = validatorFn(input ? input.data : undefined)
      return handlerFn({ data: validated })
    }

    fn.validator = (val: ValidatorFn) => {
      validatorFn = val
      return fn
    }

    fn.handler = (hand: HandlerFn) => {
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

const mockStripeCreate = vi.fn()
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
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
      expect('simulated' in result && result.simulated).toBe(true)
      expect(result.url).toBeNull()
    })

    test('calls Stripe SDK to create checkout session when STRIPE_SECRET_KEY is defined', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_legacy'

      // Mock Stripe SDK
      mockStripeCreate.mockResolvedValueOnce({
        url: 'https://checkout.stripe.com/pay/cs_test_legacy_123'
      })

      const payload = {
        email: 'operative@dstrkt.com',
        items: [
          { name: 'DSTRKT Jacket', price: 120, quantity: 1 }
        ],
        origin: 'http://localhost:3000'
      }

      const result = await createCheckoutSessionFn({ data: payload })
      expect(result).toBeDefined()
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_legacy_123')
      expect(mockStripeCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('createStripeCheckoutSessionFn (Schema-Validated & API-Direct Creator)', () => {
    const validPayload = {
      email: 'user@dstrkt.com',
      fullName: 'John Doe',
      nodeAddress: 'GRID-SECTOR-4',
      walletId: '0x1234567890abcdef1234567890abcdef12345678',
      items: [
        {
          productId: 'prod-1',
          name: 'Cybertech Cargo Pants',
          price: 240,
          quantity: 2,
          options: { size: 'M' }
        }
      ]
    }

    test('should validate input and reject negative quantities or prices', async () => {
      const invalidQty = {
        ...validPayload,
        items: [{ ...validPayload.items[0], quantity: 0 }]
      }
      const invalidPrice = {
        ...validPayload,
        items: [{ ...validPayload.items[0], price: -10 }]
      }

      await expect(
        createStripeCheckoutSessionFn({ data: invalidQty })
      ).rejects.toThrow()

      await expect(
        createStripeCheckoutSessionFn({ data: invalidPrice })
      ).rejects.toThrow()
    })

    test('returns mock URL when STRIPE_SECRET_KEY is not defined (simulation fallback)', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const result = await createStripeCheckoutSessionFn({ data: validPayload })
      expect(result).toBeDefined()
      expect('mock' in result && result.mock).toBe(true)
      expect('sessionId' in result && result.sessionId).toBeDefined()
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
      vi.stubGlobal('fetch', fetchSpy)

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
      vi.stubGlobal('fetch', fetchSpy)

      const result = await createStripeCheckoutSessionFn({ data: validPayload })

      expect(result).toBeDefined()
      expect('mock' in result && result.mock).toBe(true)
      expect('sessionId' in result && result.sessionId).toBeDefined()
      expect(result.url).toContain('/checkout?success=true')
    })
  })
})
