import { createServerFn } from '@tanstack/react-start'
import { decodeCreateCheckoutSession } from './schemas'

export const createCheckoutSessionFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    try {
      return decodeCreateCheckoutSession(data)
    } catch (error) {
      console.error('Create checkout session validation failed via @effect/schema:', error)
      throw new Error(error instanceof Error ? error.message : 'Invalid checkout session payload')
    }
  })
  .handler(async ({ data }) => {
    const stripeKey = typeof process !== 'undefined' ? process.env.STRIPE_SECRET_KEY : null
    if (stripeKey) {
      try {
        // @ts-expect-error - stripe is dynamically imported and not present in package.json dependencies
        const { default: Stripe } = await import('stripe')
        const stripe = new Stripe(stripeKey)
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: data.items.map((item) => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
          mode: 'payment',
          success_url: `${data.origin}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${data.origin}/cart?cancelled=true`,
          customer_email: data.email,
        })
        return { url: session.url }
      } catch (err: unknown) {
        console.error('Stripe creation failed:', err)
        return { error: err instanceof Error ? err.message : 'Stripe initialization error' }
      }
    }
    // Sane fallback: simulate secure session creation
    return { url: null, simulated: true }
  })
