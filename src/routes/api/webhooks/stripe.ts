import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../db'
import { orders } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { Effect } from 'effect'

export class StripeConfigError {
  readonly _tag = 'StripeConfigError'
  constructor(readonly message: string = 'Stripe configuration error') {}
}

export class SignatureVerificationError {
  readonly _tag = 'SignatureVerificationError'
  constructor(readonly message: string) {}
}

export class DatabaseError {
  readonly _tag = 'DatabaseError'
  constructor(readonly message: string = 'Database Error') {}
}

export const stripeWebhookEffect = (request: Request) =>
  Effect.gen(function* () {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    if (!stripeSecretKey) {
      console.error('Stripe Secret Key is not configured.')
      return yield* Effect.fail(new StripeConfigError())
    }

    const signature = request.headers.get('stripe-signature') || ''
    const rawBody = yield* Effect.tryPromise({
      try: () => request.text(),
      catch: (err) => new SignatureVerificationError(err instanceof Error ? err.message : 'Failed to read request body')
    })

    const stripe = new Stripe(stripeSecretKey)

    const event = yield* Effect.try({
      try: () => stripe.webhooks.constructEvent(rawBody, signature, webhookSecret),
      catch: (err) => {
        const errMsg = err instanceof Error ? err.message : 'Unknown signature verification error'
        console.error(`Webhook signature verification failed: ${errMsg}`)
        return new SignatureVerificationError(errMsg)
      }
    })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.client_reference_id || session.metadata?.orderId

      if (orderId) {
        yield* Effect.tryPromise({
          try: () => db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId)),
          catch: (dbErr) => {
            console.error(`Failed to update order ${orderId} in database:`, dbErr)
            return new DatabaseError()
          }
        })
        console.log(`Order status updated to paid for ID: ${orderId}`)
      } else {
        console.warn('No orderId or client_reference_id found in checkout session.')
      }
    }

    return { received: true }
  })

export const Route = createFileRoute('/api/webhooks/stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const program = stripeWebhookEffect(request).pipe(
          Effect.match({
            onFailure: (err) => {
              if (err._tag === 'StripeConfigError') {
                return new Response('Stripe configuration error', { status: 500 })
              }
              if (err._tag === 'SignatureVerificationError') {
                return new Response(`Webhook Error: ${err.message}`, { status: 400 })
              }
              if (err._tag === 'DatabaseError') {
                return new Response('Database Error', { status: 500 })
              }
              return new Response('Internal Server Error', { status: 500 })
            },
            onSuccess: (result) =>
              new Response(JSON.stringify(result), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
          })
        )

        return Effect.runPromise(program)
      },
    },
  },
})

