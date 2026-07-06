import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useLiveQuery } from '@tanstack/react-db'
import { useForm } from '@tanstack/react-form'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { Trash, Search, Tag, Cpu, PackageOpen, Globe, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { techWearCollection } from '../utils/clientDb'
import type { TechWearItem } from '../utils/clientDb'
import { filterSpecimens } from '../utils/clientDb'
import {
  dashboardStore,
  updateSearchQuery,
  updateCategory,
  updateStockFilter,
  toggleCreateModal
} from '../utils/store'
import { authStore } from '../utils/authStore'
import { getSessionFn } from '../lib/authSession'
import { importAliExpressProductFn } from '../lib/scraperSession'
import { getSettingsFn, updateSettingsFn } from '../lib/settingsSession'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const clientUser = authStore.state.user
    if (clientUser && clientUser.email.toLowerCase() === 'admin@dstrkt.com') {
      return
    }
    try {
      const session = await getSessionFn()
      if (session?.user?.email.toLowerCase() === 'admin@dstrkt.com') {
        return
      }
    } catch {
      // session check failed or running in non-node env
    }
    throw redirect({ to: '/auth' })
  },
  component: Dashboard
})

const columnHelper = createColumnHelper<TechWearItem>()

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => <span className="font-mono text-zinc-500 text-xs">#{info.getValue().slice(0, 8)}</span>
  }),
  columnHelper.accessor('name', {
    header: 'Product Name',
    cell: (info) => (
      <Link
        to="/products/$id"
        params={{ id: info.row.original.id }}
        className="font-bold text-white tracking-tight hover:underline focus:underline"
      >
        {info.getValue()}
      </Link>
    )
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => (
      <span className="inline-flex items-center gap-1 border border-zinc-800 bg-[#151515] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
        <Tag className="h-2.5 w-2.5" />
        {info.getValue().toUpperCase()}
      </span>
    )
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: (info) => <span className="font-mono text-white font-bold">${info.getValue()}</span>
  }),
  columnHelper.accessor('stock', {
    header: 'Stock',
    cell: (info) => {
      const stock = info.getValue()
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-300 text-xs">{stock} pcs</span>
          <div className="h-1 w-10 overflow-hidden bg-zinc-900 border border-zinc-800">
            <div
              className={`h-full transition-all ${
                stock > 5 ? 'bg-white' : stock > 0 ? 'bg-zinc-500' : 'bg-red-900'
              }`}
              style={{ width: `${Math.min((stock / 30) * 100, 100)}%` }}
            />
          </div>
        </div>
      )
    }
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const colors = {
        'In Stock': 'bg-white/10 text-white border-white/20',
        'Low Stock': 'bg-zinc-800 text-zinc-400 border-zinc-700',
        'Out of Stock': 'bg-red-950/20 text-red-500 border-red-900/30'
      }
      return (
        <span className={`inline-flex items-center border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${colors[status]}`}>
          {status}
        </span>
      )
    }
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const id = info.row.original.id
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              techWearCollection.update(id, (item) => {
                item.stock = Math.max(0, item.stock - 1)
                item.status = item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'
              })
            }}
            title="Sell 1 Unit"
            className="border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:bg-white hover:text-black transition"
          >
            <Cpu className="h-3 w-3" />
          </button>
          <button
            onClick={() => techWearCollection.delete(id)}
            title="Delete Item"
            className="border border-zinc-800 bg-zinc-900 p-1.5 text-red-500 hover:bg-red-900 hover:text-white transition"
          >
            <Trash className="h-3 w-3" />
          </button>
        </div>
      )
    }
  })
]

function Dashboard() {
  const searchQuery = useStore(dashboardStore, (s) => s.searchQuery)
  const selectedCategory = useStore(dashboardStore, (s) => s.selectedCategory)
  const stockFilter = useStore(dashboardStore, (s) => s.stockFilter)
  const isCreateModalOpen = useStore(dashboardStore, (s) => s.isCreateModalOpen)

  const { data: stats } = useQuery({
    queryKey: ['storeStats'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return {
        activeUsers: 184,
        hourlySales: '1.48 ETH',
        conversionRate: '4.12%',
        cloudflareStatus: 'Operational (LAX)'
      }
    }
  })

  const { data: rawItems = [] } = useLiveQuery((q) => q.from({ items: techWearCollection }))

  const filteredItems = useMemo(() => {
    return filterSpecimens(rawItems, searchQuery, selectedCategory, stockFilter)
  }, [rawItems, searchQuery, selectedCategory, stockFilter])

  const [sorting, setSorting] = useState<SortingState>([])
  
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })

  const { data: globalSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      try {
        return await getSettingsFn()
      } catch (err) {
        console.error('Error fetching settings:', err)
        return { marginMultiplier: 1.5 }
      }
    }
  })

  const [multiplierInput, setMultiplierInput] = useState('')
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const currentMultiplier = globalSettings?.marginMultiplier ?? 1.5

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(multiplierInput)
    if (isNaN(val) || val < 0) {
      setSettingsError('INVALID COEFFICIENT: VALUE MUST BE A NON-NEGATIVE NUMBER')
      return
    }

    setIsUpdatingSettings(true)
    setSettingsError(null)
    setSettingsSuccess(null)

    try {
      const res = await updateSettingsFn({ data: { marginMultiplier: val } })
      if (res && 'error' in res && res.error) {
        setSettingsError(res.error)
      } else {
        setSettingsSuccess(`MULTIPLIER ADJUSTED: ${val}x`)
        refetchSettings()
      }
    } catch (err: any) {
      setSettingsError(err.message || 'TRANSACTION REJECTED BY DATABASE')
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const [aliExpressUrl, setAliExpressUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scraperLog, setScraperLog] = useState<string | null>(null)
  const [scraperProgress, setScraperProgress] = useState(0)
  const [scraperError, setScraperError] = useState<string | null>(null)
  const [scraperSuccess, setScraperSuccess] = useState<string | null>(null)

  const handleAliExpressImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aliExpressUrl.trim()) return

    setIsScraping(true)
    setScraperError(null)
    setScraperSuccess(null)
    setScraperProgress(10)
    setScraperLog('INITIALIZING SCRAPER SYSTEM ADAPTER...')

    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setScraperProgress(25)
      setScraperLog('SCRAPING REMOTE NODE...')

      await new Promise((resolve) => setTimeout(resolve, 800))
      setScraperProgress(60)
      setScraperLog('MAPPING EFFECT SCHEMAS...')

      await new Promise((resolve) => setTimeout(resolve, 600))
      setScraperProgress(90)
      setScraperLog('COMMITTING RECORD...')

      const res = await importAliExpressProductFn({ data: { url: aliExpressUrl } })

      if (res && 'error' in res && res.error) {
        setScraperError(res.error)
        setScraperLog('CONNECTION REJECTED')
        setScraperProgress(0)
        setIsScraping(false)
        return
      }

      if (res && 'success' in res && res.success && 'product' in res && res.product) {
        const serverProd = res.product
        const lowerTitle = serverProd.title.toLowerCase()
        let mappedCategory = 'Accessories'
        if (lowerTitle.includes('jacket') || lowerTitle.includes('coat') || lowerTitle.includes('windbreaker') || lowerTitle.includes('shell')) {
          mappedCategory = 'Jackets'
        } else if (lowerTitle.includes('pant') || lowerTitle.includes('cargo') || lowerTitle.includes('trousers') || lowerTitle.includes('taper')) {
          mappedCategory = 'Pants'
        } else if (lowerTitle.includes('shoes') || lowerTitle.includes('boots') || lowerTitle.includes('sneaker') || lowerTitle.includes('footwear')) {
          mappedCategory = 'Footwear'
        } else if (lowerTitle.includes('under') || lowerTitle.includes('underwear')) {
          mappedCategory = 'Underwear'
        }

        const clientItem: TechWearItem = {
          id: serverProd.id,
          name: serverProd.title,
          category: mappedCategory,
          price: serverProd.finalPrice,
          stock: 10,
          status: 'In Stock'
        }

        techWearCollection.insert(clientItem)
        setScraperSuccess(`SUCCESSFULLY INGESTED: ${clientItem.name}`)
        setScraperLog('TRANSACTION COMMITTED')
        setScraperProgress(100)
        setAliExpressUrl('')
      } else {
        setScraperError('SCRAPER MODULE RETURNED NULL RESPONSE')
        setScraperLog('EXECUTION FAIL')
        setScraperProgress(0)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'UNKNOWN EXCEPTION OCCURRED'
      setScraperError(errMsg)
      setScraperLog('CRITICAL FAULT DETECTED')
      setScraperProgress(0)
    } finally {
      setIsScraping(false)
    }
  }

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const form = useForm({
    defaultValues: {
      name: '',
      category: 'Jackets',
      price: '',
      stock: ''
    },
    onSubmit: async ({ value }) => {
      const priceNum = Number(value.price) || 0
      const stockNum = Number(value.stock) || 0

      if (priceNum < 0 || stockNum < 0) {
        alert('Validation Error: Price and stock values cannot be negative numbers.')
        return
      }

      const newItem: TechWearItem = {
        id: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        name: value.name,
        category: value.category,
        price: priceNum,
        stock: stockNum,
        status: stockNum > 5 ? 'In Stock' : stockNum > 0 ? 'Low Stock' : 'Out of Stock'
      }

      techWearCollection.insert(newItem)
      form.reset()
      toggleCreateModal(false)
    }
  })

  return (
    <main className="bg-[#0a0a0a] min-h-screen text-[var(--on-surface)] overflow-x-hidden pt-20">
      
      <section className="relative h-[45vh] w-full flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Hero Background"
            className="w-full h-full object-cover object-center grayscale brightness-50 opacity-80"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmnRYHHuW7-gajfMPu9lajgyeQwbMEsMMDw3MDEPUlqA0YkCKNRfA-N5o6Iw01LdqxSgvbGHzn7ZCk2TkghqjWS6E2Nn-yDUaP7u1X63Xwc3W0muynJ_UlZiKFmvOZ2BtUYbPVshCkdf9asobmWPq1PmmDxpbO2nE9ze62uqfdJfG5yxM1MeYhGy03Vwi48B-pfkAGE9P-Yr_oQsN3J-o7T8Ti87k-t5WVV4b67qnMf3PjJN5O6bzg_dgAUhtfhzGq4psiGHrqFSQ"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
        </div>
        <div className="relative z-10 px-8 w-full max-w-[1440px] mx-auto">
          <span className="text-[11px] font-mono tracking-[0.3em] text-white/60 mb-2 block uppercase">DSTRKT UTILITY CONTROL</span>
          <h1 className="font-display font-extrabold text-4xl lg:text-6xl leading-none text-white uppercase tracking-tight max-w-2xl mb-8">
            SYSTEM CONTROL PANEL
          </h1>
          <button
            onClick={() => toggleCreateModal(true)}
            className="bg-white text-black font-mono text-xs tracking-widest px-8 py-4 hover:bg-zinc-200 transition font-bold"
          >
            ADD INVENTORY ITEM
          </button>
        </div>
      </section>

      <div className="w-full h-12 bg-[#0f0f0f] border-y border-[var(--outline)] flex items-center px-8 overflow-hidden">
        <div className="flex items-center gap-6 overflow-hidden w-full">
          <span className="font-mono text-xs text-white tracking-widest uppercase shrink-0">LOG ALERT:</span>
          <div className="animate-marquee whitespace-nowrap font-mono text-xs text-zinc-500 uppercase tracking-widest">
            <span>DSTRKT // SYSTEM v2.4 ACTIVATED — COLD FABRIC TEXTURES IN STOCK — SYSTEM STATUS OPERATIONAL — REACTIVE STREAM LIVE — </span>
            <span>DSTRKT // SYSTEM v2.4 ACTIVATED — COLD FABRIC TEXTURES IN STOCK — SYSTEM STATUS OPERATIONAL — REACTIVE STREAM LIVE — </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-3 border border-[var(--outline)] bg-[#111111] p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight mb-6">FILTERS</h3>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="SEARCH SPECIMEN..."
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-zinc-800 text-white font-mono text-xs pl-9 pr-4 py-3 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-2 uppercase">CATEGORY</label>
              <div className="flex flex-col gap-1 text-xs">
                {['All', 'Jackets', 'Pants', 'Accessories', 'Underwear', 'Footwear'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateCategory(cat)}
                    className={`text-left px-3 py-2 font-mono uppercase tracking-wider transition ${
                      selectedCategory === cat ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-2 uppercase">STOCK AVAILABILITY</label>
              <div className="flex flex-col gap-1 text-xs">
                {[
                  { id: 'all', label: 'ALL LEVELS' },
                  { id: 'in-stock', label: 'IN STOCK (>5)' },
                  { id: 'low-stock', label: 'CRITICAL LOW (1-5)' },
                  { id: 'out-of-stock', label: 'DEPLETED (0)' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateStockFilter(st.id as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock')}
                    className={`text-left px-3 py-2 font-mono uppercase tracking-wider transition ${
                      stockFilter === st.id ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'ACTIVE MONITOR', value: stats?.activeUsers ? `${stats.activeUsers} ENGAGED` : 'LOADING...' },
                { label: 'VOLUME STREAM', value: stats?.hourlySales || 'LOADING...' },
                { label: 'RATIO COEFFICIENT', value: stats?.conversionRate || 'LOADING...' },
                { label: 'CLOUD NODE', value: stats?.cloudflareStatus || 'LOADING...' }
              ].map((st, idx) => (
                <div key={idx} className="border border-[var(--outline)] bg-[#111111] p-4">
                  <span className="text-[9px] font-mono tracking-wider text-zinc-500 block mb-1 uppercase">{st.label}</span>
                  <span className="font-mono text-sm font-bold text-white uppercase">{st.value}</span>
                </div>
              ))}
            </div>

            {/* GLOBAL MARKUP SETTINGS PANEL (CYBERPUNK TECH-WEAR AESTHETIC) */}
            <div className="border border-white/10 bg-zinc-950/40 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Cpu className="h-4 w-4 text-white animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-white font-bold uppercase">GLOBAL PRICING CONFIGURATION</span>
              </div>
              <p className="font-mono text-[10.5px] text-zinc-400 leading-relaxed">
                Adjust the active system price margin multiplier coefficient. Imported dropship assets are dynamically scaled against their raw sourcing index before database commit.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-zinc-800 bg-[#0c0c0c] p-4 flex flex-col justify-center">
                  <span className="text-[9px] font-mono tracking-wider text-zinc-500 block mb-1 uppercase">CURRENT COEFFICIENT</span>
                  <span className="font-mono text-2xl font-black text-white tracking-wider">
                    {globalSettings ? `${currentMultiplier.toFixed(2)}x` : 'RETRIEVING...'}
                  </span>
                </div>

                <form onSubmit={handleUpdateSettings} className="flex flex-col justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">ADJUST MULTIPLIER</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={currentMultiplier.toString()}
                        value={multiplierInput}
                        onChange={(e) => setMultiplierInput(e.target.value)}
                        className="w-full bg-[#161616] border border-zinc-800 text-white font-mono text-xs px-4 py-3 placeholder-zinc-600 focus:outline-none focus:border-white"
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingSettings}
                        className="bg-white text-black font-mono text-xs tracking-widest font-bold px-6 py-3 hover:bg-zinc-200 transition disabled:opacity-30 shrink-0 uppercase"
                      >
                        {isUpdatingSettings ? 'COMMITTING...' : 'UPDATE'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {(settingsSuccess || settingsError) && (
                <div className="border border-zinc-800 bg-[#0c0c0c] p-3 font-mono text-[10.5px]">
                  {settingsSuccess && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-bold uppercase tracking-wider">SYSTEM CONFIG UPDATE: {settingsSuccess}</span>
                    </div>
                  )}
                  {settingsError && (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-bold uppercase tracking-wider">CRITICAL REJECTION: {settingsError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ALIEXPRESS PRODUCT IMPORT SYSTEM (CYBERPUNK SCRAPER BOX) */}
            <div className="border border-white/10 bg-zinc-950/40 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Globe className="h-4 w-4 text-white animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-white font-bold uppercase">ALIEXPRESS SCRAPE & DROP IMPORT MODULE</span>
              </div>
              <p className="font-mono text-[10.5px] text-zinc-400 leading-relaxed">
                Connect directly to an AliExpress product node. Paste the full product URL below to automatically scrape specifications, technical categorizations, prices, and initiate dropship synchronization.
              </p>
              
              <form onSubmit={handleAliExpressImport} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="url"
                      required
                      disabled={isScraping}
                      placeholder="https://www.aliexpress.com/item/100500...html"
                      value={aliExpressUrl}
                      onChange={(e) => setAliExpressUrl(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 text-white font-mono text-xs px-4 py-3.5 placeholder-zinc-600 focus:outline-none focus:border-white disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScraping || !aliExpressUrl.trim()}
                    className="bg-white text-black font-mono text-xs tracking-widest font-bold px-6 py-3.5 hover:bg-zinc-200 transition disabled:opacity-30 flex items-center justify-center gap-2 shrink-0 uppercase"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        INGESTING...
                      </>
                    ) : (
                      'IMPORT PRODUCT'
                    )}
                  </button>
                </div>
              </form>

              {/* Scraper Status / Log Panel */}
              {(isScraping || scraperLog || scraperError || scraperSuccess) && (
                <div className="border border-zinc-800 bg-[#0c0c0c] p-4 font-mono text-[10.5px] space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${isScraping ? 'bg-amber-500 animate-ping' : scraperError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className="text-zinc-400 font-bold uppercase tracking-wider">SYSTEM TELEMETRY:</span>
                    </div>
                    {isScraping && (
                      <span className="text-zinc-500 animate-pulse uppercase">PROCESSING TARGET</span>
                    )}
                  </div>

                  {scraperLog && (
                    <div className="text-zinc-300 font-bold font-mono tracking-wide">
                      &gt; {scraperLog} <span className="text-zinc-500">[{scraperProgress}%]</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {isScraping && (
                    <div className="h-1 bg-zinc-900 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${scraperProgress}%` }}
                      />
                    </div>
                  )}

                  {scraperError && (
                    <div className="flex items-start gap-2 border border-red-900/30 bg-red-950/20 p-3 text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <div className="space-y-1">
                        <div className="font-bold uppercase tracking-wide">SCRAPE FAULT REJECTED</div>
                        <div>{scraperError}</div>
                      </div>
                    </div>
                  )}

                  {scraperSuccess && (
                    <div className="flex items-start gap-2 border border-emerald-900/30 bg-emerald-950/20 p-3 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <div className="space-y-1">
                        <div className="font-bold uppercase tracking-wide">RECORD COMMIT SUCCESS</div>
                        <div>{scraperSuccess}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border border-[var(--outline)] bg-[#111111]">
              <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[#151515]">
                <div className="flex items-center gap-2">
                  <PackageOpen className="h-4 w-4 text-white" />
                  <span className="font-mono text-xs tracking-widest text-white font-bold uppercase">INVENTORY DATABASE MODULE</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">{filteredItems.length} RECORDED ENTRIES</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="bg-zinc-900 border-b border-[var(--outline)] text-zinc-400">
                        {headerGroup.headers.map((header) => (
                          <th
                             key={header.id}
                             onClick={header.column.getToggleSortingHandler()}
                             className="p-4 uppercase tracking-widest text-[10px] font-bold cursor-pointer select-none hover:text-white"
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {filteredItems.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--outline)] hover:bg-zinc-900/50 transition">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-12 text-zinc-500 font-mono">
                          NO ACTIVE SPECIMENS DETECTED IN STORAGE FOR FILTER CRITERIA
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-[var(--outline)] flex justify-between items-center bg-[#151515] font-mono text-[10px]">
                <div className="flex gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black hover:border-white disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800 transition"
                  >
                    PREVIOUS
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black hover:border-white disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800 transition"
                  >
                    NEXT
                  </button>
                </div>
                <span className="text-zinc-500 uppercase">
                  PAGE {table.getState().pagination.pageIndex + 1} OF {table.getPageCount() || 1}
                </span>
              </div>

            </div>
          </section>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="w-full max-w-md border border-white bg-[#111111] p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="font-display text-lg font-extrabold text-white uppercase tracking-tight">ADD NEW SPECIMEN</h3>
              <button
                onClick={() => toggleCreateModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-xs uppercase"
              >
                [CLOSE]
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4 font-mono text-xs text-white"
            >
              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1 uppercase">PRODUCT IDENTIFIER</label>
                <form.Field
                  name="name"
                  children={(field) => (
                    <input
                      type="text"
                      placeholder="e.g. DSTRKT-02 Thermal Vest"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      maxLength={120}
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                      required
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] tracking-widest text-zinc-500 block mb-1 uppercase">CATEGORY TYPE</label>
                <form.Field
                  name="category"
                  children={(field) => (
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                    >
                      {['Jackets', 'Pants', 'Accessories', 'Underwear', 'Footwear'].map((cat) => (
                        <option key={cat} value={cat} className="bg-[#111111]">
                          {cat.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest text-zinc-500 block mb-1 uppercase">PRICE ($ USD)</label>
                  <form.Field
                    name="price"
                    children={(field) => (
                      <input
                        type="number"
                        placeholder="290"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                        required
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-zinc-500 block mb-1 uppercase">INITIAL UNITS</label>
                  <form.Field
                    name="stock"
                    children={(field) => (
                      <input
                        type="number"
                        placeholder="15"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-[#161616] border border-zinc-800 text-white p-3 focus:outline-none focus:border-white"
                        required
                      />
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-bold tracking-widest py-4 mt-6 hover:bg-zinc-200 transition uppercase"
              >
                COMMIT SPECIMEN TO DATABASE
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
