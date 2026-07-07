import { createFileRoute, Link } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useStore } from '@tanstack/react-store'
import { useState, useMemo, useEffect } from 'react'
import { Search, Tag, ShoppingCart, Cpu, ShieldCheck, Layers, Eye, Zap, Crosshair, ArrowDown } from 'lucide-react'

import { techWearCollection } from '../utils/clientDb'
import type { TechWearItem } from '../utils/clientDb'
import { filterSpecimens } from '../utils/clientDb'
import {
  dashboardStore,
  updateSearchQuery,
  updateCategory,
  updateStockFilter,
  addToCart
} from '../utils/store'

export const Route = createFileRoute('/')({ component: StorefrontLanding })

// Curated high-aesthetic images for the techwear collection mapping
const productImages: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=800&auto=format&fit=crop', // Ghost Shell Jacket (cyberpunk tech hoodie)
  '2': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop', // Cybernetic Cargo Pants
  '3': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop', // Tactical Chest Rig / Sling
  '4': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800&auto=format&fit=crop', // Thermal Base Layer (minimal black)
  '5': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop'  // All-Weather Boots / High sneaker
}

// Fallback high-aesthetic abstract technical image
const fallbackImage = 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop'

function StorefrontLanding() {
  const searchQuery = useStore(dashboardStore, (s) => s.searchQuery)
  const selectedCategory = useStore(dashboardStore, (s) => s.selectedCategory)
  const stockFilter = useStore(dashboardStore, (s) => s.stockFilter)

  // Subscribe to TanStack DB Live Queries
  const { data: rawItems = [] } = useLiveQuery((q) => q.from({ items: techWearCollection }))

  // Memoize client-side filtering
  const filteredItems = useMemo(() => {
    return filterSpecimens(rawItems, searchQuery, selectedCategory, stockFilter)
  }, [rawItems, searchQuery, selectedCategory, stockFilter])

  // Local state for interactive sizes
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showSizeChart, setShowSizeChart] = useState(false)

  // Set default sizes for products
  useEffect(() => {
    if (rawItems.length > 0 && Object.keys(selectedSizes).length === 0) {
      const initialSizes: Record<string, string> = {}
      rawItems.forEach((item) => {
        const cat = item.category.toLowerCase()
        if (cat === 'jackets' || cat === 'underwear') {
          initialSizes[item.id] = 'M'
        } else if (cat === 'pants') {
          initialSizes[item.id] = '32'
        } else if (cat === 'footwear') {
          initialSizes[item.id] = 'US 10'
        } else {
          initialSizes[item.id] = 'One Size'
        }
      })
      setSelectedSizes(initialSizes)
    }
  }, [rawItems, selectedSizes])

  const handleQuickAdd = (item: TechWearItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const size = selectedSizes[item.id] || 'M'
    const options: Record<string, string> = {}
    
    const cat = item.category.toLowerCase()
    if (cat === 'jackets') {
      options['Size'] = size
      options['Color'] = 'Stealth Black'
    } else if (cat === 'pants') {
      options['Size'] = size
      options['Fit'] = 'Slim Tapered'
    } else if (cat === 'footwear') {
      options['Size'] = size
      options['Color'] = 'Midnight'
    } else if (cat === 'accessories') {
      options['Strap'] = 'Tactical Nylon'
    } else {
      options['Size'] = size
    }

    addToCart(item.id, item.name, item.price, 1, options)
    
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }))
    }, 1500)
  }

  // Smooth scroll helper
  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="bg-[#0a0a0a] min-h-screen text-[var(--on-surface)] overflow-x-hidden pt-20">
      
      {/* 1. Full-Bleed Cyberpunk Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Ambient Dark overlay and visual grids */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/80 to-[#0a0a0a] z-10" />
          <img
            alt="DSTRKT Hero Background"
            className="w-full h-full object-cover object-center grayscale brightness-[0.25] scale-105 animate-[pulse_10s_infinite_alternate]"
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop"
          />
          {/* Futuristic technical specs overlay */}
          <div className="absolute top-28 left-8 hidden lg:flex flex-col gap-1 font-mono text-[9px] text-zinc-500 tracking-wider uppercase z-20">
            <span>DSTRKT COORDINATE: 35.6764° N, 139.6500° E</span>
            <span>DATASTREAM STREAM: 99.42MB/S // OPERATIVE STATUS</span>
            <span>SYSTEM ENCRYPTION: SECURE // TLS-256</span>
          </div>
          <div className="absolute top-28 right-8 hidden lg:flex flex-col gap-1 font-mono text-[9px] text-zinc-500 tracking-wider uppercase text-right z-20">
            <span>STITCH_DSTRKT // NEW ARCHETYPE RENDER</span>
            <span>REINFORCED FABRIC TECHNOLOGY v2.04</span>
            <span className="flex items-center justify-end gap-1.5">
              <span className="h-1.5 w-1.5 bg-green-500 rounded-none" />
              LIVE SYNCHRONIZATION OPERATIONAL
            </span>
          </div>
        </div>

        {/* Hero typography & content */}
        <div className="relative z-10 px-8 w-full max-w-[1440px] mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 border border-white/20 bg-[#111111] px-4 py-2 mb-6 font-mono text-[10px] tracking-[0.2em] text-white/80 uppercase">
            <Layers className="h-3 w-3 text-white/60" />
            <span>FABRIC ENGINE v2.0 // DEPLOYED SERIES</span>
          </div>
          
          <h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-9xl leading-none text-white uppercase tracking-tighter max-w-5xl mb-6">
            <span className="block text-white">STITCH</span>
            <span className="block tracking-[0.1em] text-3xl md:text-5xl lg:text-6xl font-normal text-zinc-400 mt-2 font-mono">DSTRKT</span>
          </h1>

          <p className="font-mono text-xs md:text-sm text-zinc-400 max-w-xl mb-12 tracking-wide uppercase leading-relaxed">
            High-performance urban body architecture. Engineered for extreme modularity, moisture containment, and technical thermal resilience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={scrollToCatalog}
              className="bg-white text-black font-mono text-xs tracking-widest px-10 py-5 hover:bg-zinc-200 font-bold flex items-center justify-center gap-2 uppercase border border-white"
            >
              <span>EXPLORE HARDWARE CATALOG</span>
              <Zap className="h-3.5 w-3.5 fill-current" />
            </button>
            <Link
              to="/about"
              className="border border-white/20 bg-[#111111] hover:bg-zinc-800 text-white font-mono text-xs tracking-widest px-10 py-5 font-bold flex items-center justify-center gap-2 uppercase"
            >
              <span>VIEW DESIGN MANIFESTO</span>
              <Crosshair className="h-3.5 w-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToCatalog}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-zinc-500 hover:text-white uppercase"
        >
          <span>SCROLL TO SYSTEM REPOSITORY</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* Marquee Banner (Converted to static high-end editorial stillness readouts) */}
      <div className="w-full h-14 bg-black border-y border-white/5 flex items-center px-8 overflow-hidden z-20 relative">
        <div className="flex items-center gap-6 overflow-hidden w-full">
          <span className="font-mono text-xs text-white font-bold tracking-widest uppercase shrink-0 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-white rounded-none" />
            SYSTEM STREAM:
          </span>
          <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest flex flex-wrap gap-x-8 gap-y-2">
            <span>DSTRKT TECHWEAR // MODULAR CONFIGURATIONS ACTIVE</span>
            <span className="text-zinc-700">|</span>
            <span>ALL WEATHER GHOST SHELLS IN STOCK</span>
            <span className="text-zinc-700">|</span>
            <span>ZERO TOLERANCE COLD LAYERINGS</span>
            <span className="text-zinc-700">|</span>
            <span>FREE DISPATCH SECURED ON CART OVER $500</span>
          </div>
        </div>
      </div>

      {/* 2. Public Catalog Section */}
      <div id="catalog-section" className="max-w-[1440px] mx-auto px-8 py-20">
        
        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full lg:hidden border border-white/10 bg-[#111111] hover:bg-zinc-800 text-white font-mono text-xs tracking-widest py-4 px-6 flex justify-between items-center uppercase mb-4"
        >
          <span>{showFilters ? 'HIDE FILTERS [-]' : 'SHOW FILTERS [+]'}</span>
          <span className="text-[10px] text-zinc-400">({filteredItems.length} ITEMS)</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sticky Left Sidebar Filters */}
          <aside className={`lg:col-span-3 lg:w-[280px] border border-white/10 bg-[#111111] p-8 h-fit lg:sticky lg:top-24 z-10 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 block mb-2 uppercase">INDEX INVENTORY</span>
              <h3 className="font-display text-xl font-extrabold text-white uppercase tracking-tight">REPOSITORY</h3>
            </div>
            
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-[9px] font-mono tracking-widest text-zinc-400 block uppercase">METADATA SEARCH</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="SEARCH ARCHIVE..."
                  value={searchQuery}
                  onChange={(e) => updateSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs pl-10 pr-4 py-3 placeholder-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-3">
              <label className="text-[9px] font-mono tracking-widest text-zinc-400 block uppercase">CATEGORIES</label>
              <div className="flex flex-col gap-1 text-xs">
                {['All', 'Jackets', 'Pants', 'Accessories', 'Underwear', 'Footwear'].map((cat) => {
                  const count = rawItems.filter((i) => cat === 'All' || i.category === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => updateCategory(cat)}
                      className={`flex justify-between items-center px-4 py-3 font-mono uppercase tracking-wider border border-transparent ${
                        selectedCategory === cat
                          ? 'bg-white text-black border-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[9px] font-bold ${selectedCategory === cat ? 'text-black/60' : 'text-zinc-600'}`}>
                        ({count})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Availability Stock status filters */}
            <div className="space-y-3">
              <label className="text-[9px] font-mono tracking-widest text-zinc-400 block uppercase">STOCK STABILITY</label>
              <div className="flex flex-col gap-1 text-xs">
                {[
                  { id: 'all', label: 'ALL LEVELS' },
                  { id: 'in-stock', label: 'OPERATIONAL STOCK' },
                  { id: 'low-stock', label: 'CRITICAL LOW' },
                  { id: 'out-of-stock', label: 'DEPLETED RESERVES' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateStockFilter(st.id as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock')}
                    className={`text-left px-4 py-3 font-mono uppercase tracking-wider border border-transparent ${
                      stockFilter === st.id ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing Chart Toggle Panel */}
            <div className="space-y-2">
              <label className="text-[9px] font-mono tracking-widest text-zinc-400 block uppercase">PRODUCT SPECS</label>
              <button
                onClick={() => setShowSizeChart(true)}
                className="w-full border border-white/10 bg-[#111111] hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] tracking-wider py-2.5 px-4 flex items-center justify-center gap-2 uppercase"
              >
                <span>VIEW SIZING SPEC CHART</span>
              </button>
            </div>

            {/* Technical Node Indicator */}
            <div className="border-t border-white/5 pt-6 font-mono text-[9px] text-zinc-500 uppercase space-y-1">
              <div className="flex justify-between">
                <span>NODE SECTOR:</span>
                <span className="text-white">EAST-S3</span>
              </div>
              <div className="flex justify-between">
                <span>STABILITY INDEX:</span>
                <span className="text-green-500">99.98%</span>
              </div>
            </div>
          </aside>

          {/* Right Product Grid */}
          <section className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white uppercase">CATALOG SPECIMENS</h2>
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                  QUERY RETURNED {filteredItems.length} ACTIVE CLASSIFICATIONS
                </p>
              </div>
              
              <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-500 uppercase">
                <span>SORT RELEVANCE</span>
                <div className="h-1 w-1 bg-white/40" />
                <span>FILTER ACTIVE</span>
              </div>
            </div>

            {/* Responsive grid of Glassmorphism cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const size = selectedSizes[item.id] || 'M'
                  const imgUrl = productImages[item.id] || fallbackImage
                  const isLowStock = item.stock > 0 && item.stock <= 5
                  const isOutOfStock = item.stock === 0
                  
                  return (
                    <div
                      key={item.id}
                      className="group relative border border-white/10 bg-[#111111] flex flex-col justify-between hover:border-white/40"
                    >
                      {/* Top Action / Hover Indicator */}
                      <Link to="/products/$id" params={{ id: item.id }} className="block overflow-hidden relative aspect-[4/5] bg-[#0a0a0a] border-b border-white/10">
                        {/* Hover Zoom & Grayscale Overlay */}
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover grayscale brightness-90 group-hover:brightness-100 group-hover:grayscale-0"
                        />
                        
                        {/* Visual scanning mesh layer on image */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.15)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                        {/* Top Left Status Tags */}
                        <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                          <span className="inline-flex items-center border border-white/10 bg-[#0a0a0a] px-2 py-0.5 font-mono text-[8px] text-zinc-300 uppercase tracking-widest">
                            #{item.id.slice(0, 5)}
                          </span>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center border border-red-500/20 bg-red-950/90 px-2 py-0.5 font-mono text-[8px] text-red-400 uppercase tracking-widest font-bold">
                              DEPLETED
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center border border-zinc-500/30 bg-zinc-900/90 px-2 py-0.5 font-mono text-[8px] text-zinc-400 uppercase tracking-widest font-bold">
                              LOW ({item.stock} LEFT)
                            </span>
                          ) : (
                            <span className="inline-flex items-center border border-white/10 bg-[#0a0a0a] px-2 py-0.5 font-mono text-[8px] text-zinc-400 uppercase tracking-widest">
                              OPERATIONAL
                            </span>
                          )}
                        </div>

                        {/* Bottom Right Category Badge */}
                        <div className="absolute bottom-4 right-4 z-10">
                          <span className="inline-flex items-center gap-1.5 border border-white/10 bg-[#0a0a0a] px-2.5 py-1 font-mono text-[9px] text-white uppercase tracking-wider">
                            <Tag className="h-2.5 w-2.5 text-zinc-400" />
                            {item.category}
                          </span>
                        </div>

                        {/* Interactive overlay icon on image hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <div className="border border-white/20 bg-black/80 px-4 py-3 font-mono text-[10px] text-white tracking-widest uppercase flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>VIEW ARCHITECTURE</span>
                          </div>
                        </div>
                      </Link>

                      {/* Info & Purchase Area */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <Link
                            to="/products/$id"
                            params={{ id: item.id }}
                            className="font-display font-bold text-lg text-white uppercase block leading-tight tracking-tight hover:text-white/80"
                          >
                            {item.name}
                          </Link>
                          <span className="font-mono text-sm font-semibold text-zinc-300 block">
                            ${item.price} USD
                          </span>
                        </div>

                        {/* Size configuration (only if not an accessory) */}
                        {!isOutOfStock && item.category !== 'Accessories' && (
                          <div className="space-y-1.5 pt-2">
                            <span className="font-mono text-[8px] text-zinc-500 block uppercase tracking-wider">SELECT SPEC / SIZE:</span>
                            <div className="flex gap-2 flex-wrap">
                              {(item.category === 'Pants' ? ['30', '32', '34'] : item.category === 'Footwear' ? ['US 9', 'US 10', 'US 11'] : ['S', 'M', 'L']).map((sz) => (
                                <button
                                  key={sz}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setSelectedSizes((prev) => ({ ...prev, [item.id]: sz }))
                                  }}
                                  className={`border text-[10px] font-mono w-11 h-11 flex items-center justify-center uppercase ${
                                    size === sz
                                      ? 'border-white bg-white text-black font-bold'
                                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/40 hover:text-white'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dynamic Cart Button */}
                        <div className="pt-2">
                          {isOutOfStock ? (
                            <button
                              disabled
                              className="w-full bg-zinc-900 border border-white/5 text-zinc-600 font-mono text-[10px] tracking-widest py-3.5 font-bold uppercase cursor-not-allowed"
                            >
                              DEPLETED ARCHIVES
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleQuickAdd(item, e)}
                              className={`w-full font-mono text-[10px] tracking-widest py-3.5 font-bold flex items-center justify-center gap-2 uppercase border ${
                                addedItemIds[item.id]
                                  ? 'bg-zinc-950 text-white border-white'
                                  : 'bg-white text-black hover:bg-zinc-200 border-white'
                              }`}
                            >
                              {addedItemIds[item.id] ? (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                  <span>TRANSACTION COMMITTED</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  <span>ADD TO CART</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full border border-white/10 bg-[#111111] p-16 text-center font-mono">
                  <Cpu className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                  <span className="font-bold text-white uppercase block mb-2">NO PRODUCTS MATCH YOUR SEARCH</span>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-6 max-w-md mx-auto">
                    We couldn't find any products matching your search or category filters. Try resetting the filters to explore the rest of our collection.
                  </p>
                  <button
                    onClick={() => {
                      updateSearchQuery('')
                      updateCategory('All')
                      updateStockFilter('all')
                    }}
                    className="border border-white bg-white hover:bg-zinc-200 text-black font-bold uppercase text-[10px] tracking-widest px-6 py-3"
                  >
                    RESET ALL FILTERS
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 3. High Aesthetic Technical Features */}
      <section className="border-t border-white/5 bg-[#080808] py-24 relative overflow-hidden">
        {/* Subtle mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.02),transparent_50%)]" />
        
        <div className="max-w-[1440px] mx-auto px-8 relative z-10">
          <div className="max-w-3xl mb-16">
            <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase block mb-2">FABRIC ARCHITECTURE</span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white uppercase tracking-tight">
              SPECIFICATIONS & MATERIAL ENVELOPE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-mono">
            {[
              {
                id: '01',
                title: 'CORDURA® SHIELDING',
                desc: 'Uncompromising resistance against tearing and extreme abrasive elements. Lightweight woven matrices engineered for heavy mechanical loads.',
                stat: '100% SECURE'
              },
              {
                id: '02',
                title: 'DWR HYDRO-EXPULSION',
                desc: 'Fluorine-free moisture repellency coatings forcing water containment droplets to bead and route instantly away from structural boundaries.',
                stat: '20,000MM RATE'
              },
              {
                id: '03',
                title: 'MODULAR MATRIX',
                desc: 'Tactical nylon quick-release attachments and cargo configurations designed to receive third-party technical utility systems on the fly.',
                stat: 'X-PAC REINFORCED'
              }
            ].map((feat) => (
              <div key={feat.id} className="border border-white/10 bg-[#111111] p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-500 font-bold">{feat.id}</span>
                  <span className="inline-flex border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400 font-bold">{feat.stat}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white tracking-widest">{feat.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed uppercase">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sizing Specs Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 max-w-lg w-full p-8 space-y-6 relative">
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono text-xs uppercase"
            >
              [ CLOSE ]
            </button>
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 block uppercase">TECHNICAL CALIBRATION</span>
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight mt-1">SIZE & SPECIFICATION CHART</h3>
            </div>
            
            <div className="border border-white/5 divide-y divide-white/5 font-mono text-xs text-zinc-400">
              <div className="grid grid-cols-4 bg-zinc-900 p-3 font-bold text-white uppercase text-[10px] tracking-wider">
                <span>SPEC</span>
                <span>CHEST</span>
                <span>WAIST</span>
                <span>HEIGHT</span>
              </div>
              <div className="grid grid-cols-4 p-3">
                <span className="text-white font-bold">S / 30</span>
                <span>36-38"</span>
                <span>30-31"</span>
                <span>165-172cm</span>
              </div>
              <div className="grid grid-cols-4 p-3">
                <span className="text-white font-bold">M / 32</span>
                <span>38-40"</span>
                <span>32-33"</span>
                <span>172-180cm</span>
              </div>
              <div className="grid grid-cols-4 p-3">
                <span className="text-white font-bold">L / 34</span>
                <span>41-43"</span>
                <span>34-35"</span>
                <span>180-188cm</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
              * NOTE: ALL MEASUREMENTS ARE DESIGNED FOR AN ATTACHED TACTICAL SILHOUETTE. FABRIC COMPOSITION SUPPORTS 2% SPANDEX REINFORCEMENT STRETCH.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
