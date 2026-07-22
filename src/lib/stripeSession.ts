import { createServerFn } from '@tanstack/react-start'
import { decodeCreateCheckoutSession } from './schemas'
import { Effect } from 'effect'

export const createCheckoutSessionEffect = (data: ReturnType<typeof decodeCreateCheckoutSession>) =>
  Effect.gen(function* () {
    const stripeKey = typeof process !== 'undefined' ? process.env.STRIPE_SECRET_KEY : null
    if (!stripeKey) {
      return { url: null, simulated: true }
    }

    return yield* Effect.tryPromise({
      try: async () => {
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
      },
      catch: (err) => {
        console.error('Stripe creation failed via Effect:', err)
        return { error: err instanceof Error ? err.message : 'Stripe initialization error' }
      }
    })
  })

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
    const program = createCheckoutSessionEffect(data).pipe(
      Effect.catchAll((err: any) => {
        const msg = err && typeof err === 'object' && 'message' in err ? err.message : String(err)
        return Effect.succeed({ error: msg, url: null })
      })
    )
    return Effect.runPromise(program)
  })


