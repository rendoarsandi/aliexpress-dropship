import { describe, test, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'

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

import { orderRepository } from '../../../db/repositories/orderRepository'
import { Route } from './stripe'

type HttpHandler = (ctx: { request: Request }) => Promise<Response>

function getRoutePostHandler(): HttpHandler | undefined {
  const handlers = Route.options.server?.handlers
  if (handlers && typeof handlers === 'object' && 'POST' in handlers) {
    return handlers.POST as HttpHandler
  }
  return undefined
}

// Mock Stripe SDK
vi.mock('stripe', () => {
  const mockConstructEvent = vi.fn().mockImplementation(() => ({
    type: 'checkout.session.completed',
    data: {
      object: {
        client_reference_id: 'DSTRKT-ORD-TEST123',
        customer_email: 'test@example.com'
      }
    }
  }))

  const MockStripe = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.webhooks = {
      constructEvent: mockConstructEvent
    }
  })

  return {
    default: MockStripe,
    mockConstructEvent // expose so we can customize or assert
  }
})

describe('Stripe Webhook Endpoint Route Handler', () => {
  let markOrderPaidSpy: MockInstance

  beforeEach(() => {
    markOrderPaidSpy = vi.spyOn(orderRepository, 'markOrderPaid').mockResolvedValue(undefined)
  })

  afterEach(() => {
    markOrderPaidSpy.mockRestore()
  })

  test('should verify the endpoint parses and handles checkout.session.completed event and updates DB', async () => {
    // Mock environments
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'

    // Mock fetch standard Request object
    const mockRequest = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=mock_signature',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed'
      })
    })

    // Get POST handler
    const postHandler = getRoutePostHandler()
    expect(postHandler).toBeDefined()

    if (postHandler) {
      const response = await postHandler({ request: mockRequest })
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({ received: true })

      // Verify DB update was triggered with correct order ID
      expect(markOrderPaidSpy).toHaveBeenCalledWith('DSTRKT-ORD-TEST123')
    }
  })

  test('should fail if signature is missing or verification fails', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'

    // Requiring Stripe mock to throw signature verification error
    const stripeModule = (await import('stripe')) as typeof import('stripe') & {
      mockConstructEvent: ReturnType<typeof vi.fn>
    }
    stripeModule.mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('No matching signature found')
    })

    const mockRequest = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ id: 'evt_test_123' })
    })

    const postHandler = getRoutePostHandler()
    expect(postHandler).toBeDefined()

    if (postHandler) {
      const response = await postHandler({ request: mockRequest })
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain('Webhook Error: No matching signature found')
    }
  })
})
