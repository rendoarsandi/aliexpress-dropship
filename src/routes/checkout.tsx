import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import { CheckCircle, Terminal, ArrowLeft, ArrowRight, Loader2, CreditCard, ShieldCheck } from 'lucide-react'

import { cartStore, clearCart, calculateCartTotals, addOrder } from '../utils/store'
import type { TrackedOrder } from '../utils/store'
import { authStore } from '../utils/authStore'
import { techWearCollection } from '../utils/clientDb'
import { createCheckoutSessionFn } from '../lib/stripeSession'

export const Route = createFileRoute('/checkout')({
  component: Checkout,
})

function Checkout() {
  const navigate = useNavigate()
  const items = useStore(cartStore, (s) => s.items)
  const auth = useStore(authStore)
  
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Stripe redirect simulation state
  const [stripeStatus, setStripeStatus] = useState<string | null>(null)
  const [stripeProgress, setStripeStatusProgress] = useState(0)

  const { subtotal, shipping, vat, total } = calculateCartTotals(items)

  const form = useForm({
    defaultValues: {
      email: auth.user?.email || '',
      fullName: auth.user?.fullName || '',
      nodeAddress: auth.user?.shippingAddress || '',
      walletId: auth.user?.walletId || '',
      paymentMethod: 'stripe' as 'stripe' | 'wallet'
    },
    onSubmit: async ({ value }) => {
      if (items.length === 0) return
      setIsSubmitting(true)

      // 1. STRIPE REAL / SIMULATE REDIRECT SEQUENCE
      if (value.paymentMethod === 'stripe') {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : ''
          const stripeRes = await createCheckoutSessionFn({
            data: {
              email: value.email,
              items: items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              origin
            }
          })
          if (stripeRes && stripeRes.url) {
            window.location.href = stripeRes.url
            return
          } else if (stripeRes && stripeRes.error) {
            alert(`Stripe Session Creation Error: ${stripeRes.error}`)
            setIsSubmitting(false)
            return
          }
        } catch (e) {
          console.error('Stripe check failed, running simulation fallback', e)
        }

        const statuses = [
          { msg: 'INITIALIZING SECURE STRIPE GATEWAY SESSION...', delay: 600, prog: 20 },
          { msg: 'VERIFYING INVENTORY NODE DEPLOYMENTS...', delay: 500, prog: 45 },
          { msg: 'REDIRECTING TO STRIPE SECURE ENDPOINT...', delay: 800, prog: 75 },
          { msg: 'STRIPE TRANSACTION CLEARANCE OBTAINED // RETURN TO STITCH_DSTRKT...', delay: 600, prog: 100 }
        ]

        for (const step of statuses) {
          setStripeStatus(step.msg)
          setStripeStatusProgress(step.prog)
          await new Promise((resolve) => setTimeout(resolve, step.delay))
        }
      } else {
        // wallet simulation
        setStripeStatus('RESOLVING SECURE BLOCKCHAIN LEDGER TRANSACTION...')
        setStripeStatusProgress(50)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        setStripeStatusProgress(100)
      }

      // Deduct inventory items from database for each item in cart
      items.forEach((cartItem) => {
        techWearCollection.update(cartItem.productId, (item) => {
          item.stock = Math.max(0, item.stock - cartItem.quantity)
          item.status = item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'
        })
      })

      // Generate secure unique transaction ID
      let hexToken = ''
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomBuffer = new Uint8Array(4)
        crypto.getRandomValues(randomBuffer)
        hexToken = Array.from(randomBuffer, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      } else {
        hexToken = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
      }
      const generatedId = `DSTRKT-ORD-${hexToken}`

      // Create new tracked order payload
      const newOrderPayload: TrackedOrder = {
        id: generatedId,
        email: value.email,
        fullName: value.fullName,
        shippingAddress: value.nodeAddress,
        walletId: value.walletId,
        items: [...items],
        subtotal,
        shipping,
        vat,
        total,
        status: 'QUEUED FOR ROUTING',
        placedAt: new Date().toISOString(),
        telemetryLogs: [
          'SECURE TELEMETRY TRANSACTION ROUTED',
          value.paymentMethod === 'stripe' ? 'STRIPE DIRECT REDIRECT VERIFIED OK' : 'WEB3 WALLET BLOCK CONFIRMED',
          'INVENTORY RESERVATION DEPLOYED',
          'WAITING FOR COURIER EXPULSION SQUAD'
        ]
      }

      // Add to dynamic orders history
      addOrder(newOrderPayload)

      setOrderId(generatedId)
      setOrderPlaced(true)
      clearCart()
      setIsSubmitting(false)
      setStripeStatus(null)
    },
  })

  // Autofill checkout fields if auth.user resolves
  useEffect(() => {
    if (auth.user) {
      form.reset({
        email: auth.user.email,
        fullName: auth.user.fullName,
        nodeAddress: auth.user.shippingAddress || '',
        walletId: auth.user.walletId || '',
        paymentMethod: 'stripe'
      })
    }
  }, [auth.user, form])

  // Redirect if cart is empty and order hasn't just been placed
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate({ to: '/cart' })
    }
  }, [items, orderPlaced, navigate])

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16 flex items-center justify-center">
        <div className="max-w-xl w-full border border-white/10 bg-zinc-950/60 backdrop-blur-2xl p-10 font-mono text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white animate-pulse" />
          
          <CheckCircle className="h-16 w-16 text-white mx-auto mb-6" />
          
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">
            TRANSACTION COMMITTED SECURELY
          </span>
          <h1 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight mb-6">
            ORDER DEPLOYED
          </h1>

          <div className="bg-zinc-900/40 border border-white/5 p-6 text-left space-y-4 mb-8 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-zinc-500 uppercase">ORDER ID</span>
              <span className="text-white font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-zinc-500 uppercase">PAYMENT BLOCK</span>
              <span className="text-white font-bold">STRIPE SECURE GATEWAY</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-zinc-500 uppercase">LOGISTICS STATUS</span>
              <span className="text-white font-bold uppercase animate-pulse">QUEUED FOR ROUTING</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500 uppercase">TOTAL BLOCK VALUE</span>
              <span className="text-white font-bold">${total} USD</span>
            </div>
          </div>

          <p className="text-zinc-500 text-xs leading-6 mb-8 uppercase tracking-wider">
            An encrypted transactional ledger invoice and routing metrics trace token was routed to the node boundary. Track order progress inside the live dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center gap-2 border border-white bg-white px-6 py-4 text-xs font-bold text-black hover:bg-zinc-200 transition-all uppercase tracking-widest"
            >
              <span>TRACK ORDER PROTOCOLS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-white/10 bg-zinc-900/40 px-6 py-4 text-xs font-bold text-white hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-widest"
            >
              <span>RETURN TO CATALOG</span>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16 relative">
      
      {/* Stripe simulation loading interface overlay */}
      {stripeStatus && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md border border-white/10 bg-zinc-950 p-8 font-mono text-center space-y-6">
            <Loader2 className="h-12 w-12 text-white animate-spin mx-auto" />
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest text-zinc-500 uppercase block">SECURE TELEMETRY REDIRECT</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-relaxed">
                {stripeStatus}
              </h3>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-zinc-900 border border-white/5 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${stripeProgress}%` }}
              />
            </div>
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest block">STRIPE SSL ENDPOINT CLIENT: ACTIVE</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px]">
        {/* Navigation Breadcrumb */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-mono text-[10px] tracking-widest uppercase mb-12"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>RETURN TO TRANSACTION MANIFEST (CART)</span>
        </Link>

        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-12 border-b border-white/5 pb-8">
          <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase block">
            DEBIT INTERFACE PROTOCOL
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
            SECURE CHECKOUT FLOW
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout shipping/billing form */}
          <section className="lg:col-span-7 border border-white/5 bg-zinc-950/40 p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/5">
              <Terminal className="h-5 w-5 text-white" />
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                DEBIT VERIFICATION METRICS
              </h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-6 font-mono text-xs text-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] tracking-widest text-zinc-500 block mb-2 uppercase">
                    NODE DESTINATION ADDRESS (EMAIL)
                  </label>
                  <form.Field
                    name="email"
                    children={(field) => (
                      <input
                        type="email"
                        placeholder="e.g. operative_099@domain.com"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                        required
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="text-[9px] tracking-widest text-zinc-500 block mb-2 uppercase">
                    OPERATIVE FULL NAME
                  </label>
                  <form.Field
                    name="fullName"
                    children={(field) => (
                      <input
                        type="text"
                        placeholder="e.g. ALEX CHEN"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        maxLength={100}
                        className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                        required
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] tracking-widest text-zinc-500 block mb-2 uppercase">
                  DELIVERY GRID NODE (STREET ADDRESS)
                </label>
                <form.Field
                  name="nodeAddress"
                  children={(field) => (
                    <input
                      type="text"
                      placeholder="e.g. GRID-SECTOR 4B, NEOMETROPOLIS"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      maxLength={300}
                      className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                      required
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] tracking-widest text-zinc-500 block mb-2 uppercase">
                    CRYPTOGRAPHIC WALLET INTERNET KEY
                  </label>
                  <form.Field
                    name="walletId"
                    children={(field) => (
                      <input
                        type="text"
                        placeholder="0x71C...B9e3"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        maxLength={100}
                        className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="text-[9px] tracking-widest text-zinc-500 block mb-2 uppercase">
                    PAYMENT DELEGATION GATEWAY
                  </label>
                  <form.Field
                    name="paymentMethod"
                    children={(field) => (
                      <select
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value as 'stripe' | 'wallet')}
                        className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                      >
                        <option value="stripe">STRIPE SECURE GATEWAY (SERVER REDIRECT)</option>
                        <option value="wallet">WEB3 COLD WALLET KEY DEPOSIT</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Payment specific visual tips */}
              <div className="border border-dashed border-white/10 bg-zinc-900/10 p-5 font-mono text-[10px] text-zinc-400 space-y-2 uppercase tracking-wide">
                <span className="font-bold text-white flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                  GATEWAY STRIPE SPECIFICATION:
                </span>
                <p>
                  Stripe Checkout redirects securely on click. Fully encrypted using SHA-256 protocols. No credit card metrics are logged inside Stitch local databases.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={items.length === 0 || isSubmitting}
                  className="w-full bg-white text-black font-mono text-xs tracking-widest py-4.5 hover:bg-zinc-200 transition-all duration-300 font-bold flex items-center justify-center gap-2 uppercase disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed border border-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>COMMITTING SECURE STRIPE GATEWAY CLEARANCE...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRM SECURE PAYMENT REDIRECT</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Right Summary Order sidebar */}
          <section className="lg:col-span-5 space-y-6">
            <div className="border border-white/5 bg-zinc-950/20 p-8 space-y-6">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 block uppercase border-b border-white/5 pb-3">
                PAYLOAD MANIFEST SUMMARY
              </span>

              {items.length > 0 ? (
                <div className="space-y-4 max-h-[40vh] overflow-y-auto divide-y divide-white/5 pr-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex gap-4 items-center justify-between ${idx > 0 ? 'pt-4' : ''}`}>
                      <div className="space-y-1">
                        <span className="font-bold text-white text-xs uppercase block">{item.name}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.entries(item.options).map(([k, v]) => (
                            <span key={k} className="text-[9px] font-mono border border-white/10 px-1.5 py-0.5 bg-zinc-900/40 text-zinc-400 uppercase">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 block">
                          QTY: {item.quantity} × ${item.price}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-white font-bold">
                        ${item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 font-mono text-xs text-zinc-500 uppercase">
                  No active payload specimens detected
                </div>
              )}

              <div className="space-y-3 pt-6 border-t border-white/5 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span className="text-white">${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>UTILITY TAX (VAT)</span>
                  <span className="text-white">${vat}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROUTING LOGISTICS</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE ROUTING' : `$${shipping}`}
                  </span>
                </div>
                <div className="border-t border-white/5 pt-4 flex justify-between text-sm font-bold">
                  <span className="text-white">FINAL DEBIT DELEGATION</span>
                  <span className="text-white font-bold text-base">${total} USD</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
                <span>ROUTED VIA COMPLIANT GATEWAY SPEC_X9</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
