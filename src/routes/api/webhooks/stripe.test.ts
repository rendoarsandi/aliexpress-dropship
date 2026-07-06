import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
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

import { db } from '../../../db'
import { Route } from './stripe'

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

  const MockStripe = vi.fn().mockImplementation(function (this: any) {
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
  let updateSpy: any
  let setSpy: any
  let whereSpy: any

  beforeEach(() => {
    // Spy on the DB update operations
    setSpy = vi.fn().mockReturnThis()
    whereSpy = vi.fn().mockResolvedValue({} as any)
    updateSpy = vi.spyOn(db, 'update').mockReturnValue({
      set: setSpy,
    } as any)

    setSpy.mockReturnValue({
      where: whereSpy
    })
  })

  afterEach(() => {
    updateSpy.mockRestore()
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
    const postHandler = Route.options.server?.handlers?.POST
    expect(postHandler).toBeDefined()

    if (postHandler) {
      const response = await postHandler({ request: mockRequest })
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({ received: true })

      // Verify DB update was triggered
      expect(updateSpy).toHaveBeenCalled()
      expect(setSpy).toHaveBeenCalledWith({ status: 'paid' })
      expect(whereSpy).toHaveBeenCalled()
    }
  })

  test('should fail if signature is missing or verification fails', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'

    // Requiring Stripe mock to throw signature verification error
    const stripeModule = await import('stripe') as any
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

    const postHandler = Route.options.server?.handlers?.POST
    expect(postHandler).toBeDefined()

    if (postHandler) {
      const response = await postHandler({ request: mockRequest })
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain('Webhook Error: No matching signature found')
    }
  })
})
