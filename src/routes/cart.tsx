import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { ShoppingBag, Trash, ArrowRight, ArrowLeft, Terminal, ShieldCheck } from 'lucide-react'
import { cartStore, removeFromCart, updateCartQuantity, calculateCartTotals } from '../utils/store'

export const Route = createFileRoute('/cart')({
  component: Cart,
})

function Cart() {
  const items = useStore(cartStore, (s) => s.items)

  const { subtotal, shipping, vat, total } = calculateCartTotals(items)

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-12">
          <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase block">
            TRANSACTION SECTOR
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
            LOCAL STORAGE CART
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items Listing */}
          <section className="lg:col-span-8 space-y-6">
            <div className="border border-[var(--outline)] bg-[#111111]">
              {/* Table Header */}
              <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[#151515]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase">
                  <Terminal className="h-4 w-4" />
                  <span>TRANSACTION MANIFEST</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">
                  {items.length} ACTIVE SPECIMEN ENTRIES
                </span>
              </div>

              {items.length > 0 ? (
                <div className="divide-y divide-[var(--outline)]">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-950/20 transition">
                      
                      {/* Product Metadata info */}
                      <div className="flex-1 space-y-2">
                        <Link
                          to="/products/$id"
                          params={{ id: item.productId }}
                          className="font-bold text-white tracking-tight hover:underline focus:underline text-lg uppercase block"
                        >
                          {item.name}
                        </Link>
                        
                        {/* Options badge overlay */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.options).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center border border-zinc-800 bg-[#161616] px-2 py-0.5 font-mono text-[9px] text-zinc-400 uppercase"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Controls and Price info */}
                      <div className="flex items-center justify-between md:justify-end gap-12 font-mono">
                        {/* Quantity selection */}
                        <div className="flex items-center gap-2 border border-zinc-800 bg-[#161616] p-1">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent font-bold transition text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs text-white min-w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold transition text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Price calculation */}
                        <div className="text-right min-w-[100px]">
                          <span className="text-xs text-zinc-500 block uppercase">SUBTOTAL</span>
                          <span className="text-sm font-bold text-white">${item.price * item.quantity}</span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          title="Erase Specimen"
                          className="border border-zinc-800 bg-zinc-900 p-2 text-red-500 hover:bg-red-900 hover:text-white transition"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <ShoppingBag className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <span className="font-mono text-sm font-bold text-zinc-400 block mb-1 uppercase">CART CONTAINS NO PAYLOADS</span>
                  <p className="text-zinc-600 font-mono text-[10px] mb-6 uppercase">Please load some specimens into the transaction overlay first.</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-6 py-3 text-xs font-bold text-white hover:bg-white hover:text-black hover:border-white transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    BACK TO CATALOG
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Checkout transaction panel */}
          <section className="lg:col-span-4">
            <div className="border border-[var(--outline)] bg-[#111111] p-8 space-y-6">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 block uppercase border-b border-zinc-900 pb-3">
                FINANCIAL COEFFICIENT REPORT
              </span>

              <div className="space-y-4 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>MANIFEST COST</span>
                  <span className="text-white">${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>UTILITY TAX (VAT 20%)</span>
                  <span className="text-white">${vat}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROUTING LOGISTICS</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE ROUTING' : `$${shipping}`}
                  </span>
                </div>
                <div className="border-t border-zinc-900 pt-4 flex justify-between text-sm font-bold">
                  <span className="text-white">TOTAL PAYLOAD COST</span>
                  <span className="text-white">${total} USD</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 space-y-4">
                {items.length > 0 ? (
                  <Link
                    to="/checkout"
                    className="w-full bg-white text-black font-mono text-xs tracking-widest py-4 hover:bg-zinc-200 transition font-bold flex items-center justify-center gap-2 uppercase"
                  >
                    <span>INITIATE TRANSACTION SECURELY</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-600 font-mono text-xs tracking-widest py-4 font-bold uppercase cursor-not-allowed"
                  >
                    EMPTY TRANSACTION
                  </button>
                )}

                <div className="flex items-center gap-2 justify-center text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>TRANSACTION CRYPTOGRAPHICALLY ASSURED</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
