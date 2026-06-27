import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { CheckCircle, Terminal, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cartStore, clearCart, calculateCartTotals } from '../utils/store'
import { techWearCollection } from '../utils/clientDb'

export const Route = createFileRoute('/checkout')({
  component: Checkout,
})

function Checkout() {
  const items = useStore(cartStore, (s) => s.items)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { subtotal, shipping, vat, total } = calculateCartTotals(items)

  const form = useForm({
    defaultValues: {
      email: '',
      fullName: '',
      nodeAddress: '',
      walletId: '',
    },
    onSubmit: async ({ value: _value }) => {
      if (items.length === 0) {
        return
      }
      setIsSubmitting(true)

      // Simulate network verification delays
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Deduct inventory items from the database for each item in the cart
      items.forEach((cartItem) => {
        techWearCollection.update(cartItem.productId, (item) => {
          item.stock = Math.max(0, item.stock - cartItem.quantity)
          item.status = item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'
        })
      })

      let hexToken = ''
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomBuffer = new Uint8Array(4)
        crypto.getRandomValues(randomBuffer)
        hexToken = Array.from(randomBuffer, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      } else {
        hexToken = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
      }
      const generatedId = `DSTRKT-ORD-${hexToken}`
      setOrderId(generatedId)
      setOrderPlaced(true)
      clearCart()
      setIsSubmitting(false)
    },
  })

  // Display confirmation overlay when order successfully processed
  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16 flex items-center justify-center">
        <div className="max-w-xl border border-white bg-[#111111] p-10 font-mono text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white animate-pulse" />
          
          <CheckCircle className="h-16 w-16 text-white mx-auto mb-6" />
          
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">
            TRANSACTION COMMITTED SUCCESSFULLY
          </span>
          <h1 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight mb-6">
            ORDER CONCLUDED
          </h1>

          <div className="bg-[#151515] border border-zinc-800 p-6 text-left space-y-4 mb-8 text-xs">
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-zinc-500 uppercase">ORDER HASH</span>
              <span className="text-white font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-zinc-500 uppercase">PAYMENT VECTOR</span>
              <span className="text-white">ENCRYPTED PROTOCOL</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-zinc-500 uppercase">LOGISTICS STATUS</span>
              <span className="text-white font-bold uppercase animate-pulse">QUEUED FOR ROUTING</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500 uppercase">TOTAL DEBIT</span>
              <span className="text-white font-bold">${total} USD</span>
            </div>
          </div>

          <p className="text-zinc-500 text-xs leading-6 mb-8 uppercase tracking-wide">
            An encrypted transactional ledger invoice and routing metrics trace token was routed to the node boundary. Return to catalogs below.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-8 py-4 text-xs font-bold text-white hover:bg-white hover:text-black hover:border-white transition uppercase tracking-widest"
          >
            <ArrowLeft className="h-4 w-4" />
            RETURN TO DATABASE CONTROL
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Navigation Breadcrumb */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-mono text-[10px] tracking-widest uppercase mb-12"
        >
          <ArrowLeft className="h-3 w-3" />
          RETURN TO TRANSACTION MANIFEST (CART)
        </Link>

        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-12">
          <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase block">
            DEBIT INTERFACE PROTOCOL
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
            SECURE CHECKOUT FLOW
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout shipping/billing form */}
          <section className="lg:col-span-7 border border-[var(--outline)] bg-[#111111] p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-zinc-900">
              <Terminal className="h-5 w-5 text-white" />
              <h2 className="font-mono text-sm font-bold text-white uppercase">
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
              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1.5 uppercase">
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
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                      required
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1.5 uppercase">
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
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                      required
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1.5 uppercase">
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
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                      required
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1.5 uppercase">
                  CRYPTOGRAPHIC WALLET INTERNET KEY (OR CARD MOCK ID)
                </label>
                <form.Field
                  name="walletId"
                  children={(field) => (
                    <input
                      type="text"
                      placeholder="e.g. 0x71C...B9e3 or CARD NUMBER"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      maxLength={100}
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                      required
                    />
                  )}
                />
              </div>

              <div className="pt-6 border-t border-zinc-900">
                <button
                  type="submit"
                  disabled={items.length === 0 || isSubmitting}
                  className="w-full bg-white text-black font-mono text-xs tracking-widest py-4 hover:bg-zinc-200 transition font-bold flex items-center justify-center gap-2 uppercase disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      SIMULATING COLD LEDGER TRANSACTION...
                    </>
                  ) : (
                    <>
                      <span>CONFIRM SECURITY EXCLUSION & ORDER</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Right Summary Order sidebar */}
          <section className="lg:col-span-5 space-y-6">
            <div className="border border-[var(--outline)] bg-[#111111] p-8 space-y-6">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 block uppercase border-b border-zinc-900 pb-3">
                PAYLOAD MANIFEST SUMMARY
              </span>

              {items.length > 0 ? (
                <div className="space-y-4 max-h-[30vh] overflow-y-auto divide-y divide-zinc-900 pr-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex gap-4 items-center justify-between ${idx > 0 ? 'pt-4' : ''}`}>
                      <div className="space-y-1">
                        <span className="font-bold text-white text-xs uppercase block">{item.name}</span>
                        <div className="flex gap-1">
                          {Object.entries(item.options).map(([k, v]) => (
                            <span key={k} className="text-[9px] font-mono text-zinc-500 uppercase">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400 block">
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

              <div className="space-y-3 pt-6 border-t border-zinc-900 font-mono text-xs text-zinc-400">
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
                <div className="border-t border-zinc-900 pt-4 flex justify-between text-sm font-bold">
                  <span className="text-white">FINAL DEBIT DELEGATION</span>
                  <span className="text-white">${total} USD</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
