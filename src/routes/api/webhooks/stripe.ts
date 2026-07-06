import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../db'
import { orders } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

export const Route = createFileRoute('/api/webhooks/stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

        const signature = request.headers.get('stripe-signature') || ''
        const rawBody = await request.text()

        if (!stripeSecretKey) {
          console.error('Stripe Secret Key is not configured.')
          return new Response('Stripe configuration error', { status: 500 })
        }

        const stripe = new Stripe(stripeSecretKey)

        let event: Stripe.Event
        try {
          event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown signature verification error'
          console.error(`Webhook signature verification failed: ${errMsg}`)
          return new Response(`Webhook Error: ${errMsg}`, { status: 400 })
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session
          const orderId = session.client_reference_id || session.metadata?.orderId

          if (orderId) {
            try {
              // Update order status in SQLite DB
              await db
                .update(orders)
                .set({ status: 'paid' })
                .where(eq(orders.id, orderId))
              
              console.log(`Order status updated to paid for ID: ${orderId}`)
            } catch (dbErr) {
              console.error(`Failed to update order ${orderId} in database:`, dbErr)
              return new Response('Database Error', { status: 500 })
            }
          } else {
            console.warn('No orderId or client_reference_id found in checkout session.')
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
