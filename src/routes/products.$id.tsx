import { createFileRoute, Link } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, ArrowLeft, ShieldAlert, Cpu, Check } from 'lucide-react'
import { techWearCollection } from '../utils/clientDb'
import { addToCart } from '../utils/store'

export const Route = createFileRoute('/products/$id')({
  component: ProductDetail,
})

function ProductDetail() {
  const { id } = Route.useParams()

  // Subscribe to live query for this product
  const { data: rawItems = [] } = useLiveQuery((q) => q.from({ items: techWearCollection }))
  const product = useMemo(() => rawItems.find((item) => item.id === id), [rawItems, id])

  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  // Configure variant options based on category
  const optionsConfig = useMemo(() => {
    if (!product) return []
    const cat = product.category.toLowerCase()
    if (cat === 'jackets') {
      return [
        { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['Stealth Black', 'Cipher Gray', 'Acid Lime'] }
      ]
    } else if (cat === 'pants') {
      return [
        { name: 'Size', values: ['30', '32', '34', '36'] },
        { name: 'Fit', values: ['Slim Tapered', 'Oversized Cargo'] }
      ]
    } else if (cat === 'footwear') {
      return [
        { name: 'Size', values: ['US 8', 'US 9', 'US 10', 'US 11'] },
        { name: 'Color', values: ['Midnight', 'Vapor Gray'] }
      ]
    } else if (cat === 'accessories') {
      return [
        { name: 'Strap', values: ['Tactical Nylon', 'Quick-Release Cobra'] }
      ]
    }
    return [
      { name: 'Size', values: ['S', 'M', 'L', 'XL'] }
    ]
  }, [product])

  // Initialize selected options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Update selected options once product async query resolves (Correctness Axis 1 Fix)
  useEffect(() => {
    if (product && Object.keys(selectedOptions).length === 0) {
      const cat = product.category.toLowerCase()
      const initial: Record<string, string> = {}
      if (cat === 'jackets') {
        initial['Size'] = 'M'
        initial['Color'] = 'Stealth Black'
      } else if (cat === 'pants') {
        initial['Size'] = '32'
        initial['Fit'] = 'Slim Tapered'
      } else if (cat === 'footwear') {
        initial['Size'] = 'US 10'
        initial['Color'] = 'Midnight'
      } else if (cat === 'accessories') {
        initial['Strap'] = 'Tactical Nylon'
      } else {
        initial['Size'] = 'M'
      }
      setSelectedOptions(initial)
    }
  }, [product, selectedOptions])

  if (!product) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16 flex items-center justify-center">
        <div className="max-w-md border border-red-900 bg-red-950/10 p-8 text-center font-mono">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-white uppercase mb-2">SPECIMEN NOT DEPLOYED</h1>
          <p className="text-zinc-500 text-xs mb-6">
            The requested identifier #{id} does not map to any active inventory specimen inside the node database.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-6 py-3 text-xs font-bold text-white hover:bg-white hover:text-black hover:border-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            RETURN TO CATALOG
          </Link>
        </div>
      </main>
    )
  }

  const handleAddToCart = () => {
    addToCart(product.id, product.name, product.price, quantity, selectedOptions)
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-mono text-[10px] tracking-widest uppercase mb-12"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK TO SYSTEM CONTROL PANEL
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Specimen Hologram Mock */}
          <section className="lg:col-span-6 border border-[var(--outline)] bg-[#111111] p-8 flex flex-col justify-between relative overflow-hidden h-[60vh] lg:h-[70vh]">
            {/* Grid overlay background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            <div className="flex justify-between items-start z-10">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                SPECIMEN ID: #{product.id.slice(0, 8)}
              </span>
              <span className="inline-flex items-center border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                {product.category}
              </span>
            </div>

            {/* Glowing Technical Hologram Circle */}
            <div className="relative flex items-center justify-center h-full">
              <div className="absolute h-56 w-56 rounded-full border border-white/5 animate-spin duration-10000" />
              <div className="absolute h-40 w-40 rounded-full border border-white/10 animate-reverse-spin" />
              <div className="absolute h-24 w-24 rounded-full bg-white/5 blur-xl animate-pulse" />
              <Cpu className="h-16 w-16 text-white/30 z-10" />
            </div>

            <div className="flex justify-between items-end z-10 font-mono text-[9px] text-zinc-500">
              <span>SCANNING FREQUENCY: 1.082GHz</span>
              <span>RENDER OK</span>
            </div>
          </section>

          {/* Right Product Configuration Details */}
          <section className="lg:col-span-6 border border-[var(--outline)] bg-[#111111] p-10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase mb-3 block">
                DSTRKT HARDWARE ARCHITECTURE
              </span>
              <h1 className="font-display text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-4 uppercase">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-8 border-y border-zinc-900 py-4">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">ACQUISITION PRICE</span>
                  <span className="font-mono text-2xl font-bold text-white">${product.price} USD</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">NODE AVAILABILITY</span>
                  <span className={`inline-flex items-center text-xs font-mono font-bold mt-1 uppercase ${
                    product.stock > 5 ? 'text-white' : product.stock > 0 ? 'text-zinc-400' : 'text-red-500'
                  }`}>
                    {product.status} ({product.stock} UNITS)
                  </span>
                </div>
              </div>

              {/* Dynamic Option Configuration */}
              <div className="space-y-6 mb-8">
                {optionsConfig.map((opt) => (
                  <div key={opt.name}>
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-2.5 uppercase">
                      SELECT {opt.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => (
                        <button
                          key={val}
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                          className={`border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                            selectedOptions[opt.name] === val
                              ? 'border-white bg-white text-black font-bold'
                              : 'border-zinc-800 bg-[#161616] text-zinc-400 hover:border-zinc-500 hover:text-white'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quantity selection */}
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-2.5 uppercase">
                    QUANTITY
                  </span>
                  <div className="flex items-center gap-3 border border-zinc-800 bg-[#161616] w-fit p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || product.stock === 0}
                      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent font-mono text-base font-bold transition"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm text-white px-3 min-w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock || product.stock === 0}
                      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent font-mono text-base font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Action */}
            <div className="pt-6 border-t border-zinc-900">
              {product.stock > 0 ? (
                <button
                  onClick={handleAddToCart}
                  className={`w-full font-mono text-xs tracking-widest py-4.5 transition font-bold flex items-center justify-center gap-3 uppercase ${
                    isAdded
                      ? 'bg-zinc-900 text-white border border-white'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      ADDITION SUCCESSFUL
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      ADD SPECIMEN TO CART
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-600 font-mono text-xs tracking-widest py-4.5 font-bold uppercase cursor-not-allowed"
                >
                  DEPLETED RESERVES // OUT OF STOCK
                </button>
              )}
              <div className="mt-4 text-[9px] font-mono text-zinc-500 text-center uppercase tracking-widest">
                GUARANTEED ENCRYPTED END-TO-END FLOW DEPLOYMENT
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
