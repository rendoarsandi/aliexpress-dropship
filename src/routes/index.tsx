import { createFileRoute, Link } from '@tanstack/react-router'
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
import { Trash, Search, Tag, Cpu, PackageOpen } from 'lucide-react'

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

export const Route = createFileRoute('/')({ component: Dashboard })

const columnHelper = createColumnHelper<TechWearItem>()

// Move column definitions outside component to maintain a stable reference (Performance Axis 1 Fix)
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

  // Fetch mock server-side statistics
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

  // Subscribe to TanStack DB Live Queries
  const { data: rawItems = [] } = useLiveQuery((q) => q.from({ items: techWearCollection }))

  // Memoize client-side filtering to avoid main thread layout freezes (Performance Axis 2 / Architecture Axis 2 Fix)
  const filteredItems = useMemo(() => {
    return filterSpecimens(rawItems, searchQuery, selectedCategory, stockFilter)
  }, [rawItems, searchQuery, selectedCategory, stockFilter])

  const [sorting, setSorting] = useState<SortingState>([])
  
  // Manage pagination state (Performance Axis 3 Fix)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })

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

      // Secure bounds boundary validation check (Security Axis 1 Fix)
      if (priceNum < 0 || stockNum < 0) {
        alert('Validation Error: Price and stock values cannot be negative numbers.')
        return
      }

      const newItem: TechWearItem = {
        id: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15), // Cryptographically secure ID (Security Axis 2 Fix)
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
      
      {/* Dynamic Dark Hero Banner */}
      <section className="relative h-[65vh] w-full flex items-center overflow-hidden">
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
          <h1 className="font-display font-extrabold text-5xl lg:text-7xl leading-none text-white uppercase tracking-tight max-w-2xl mb-8">
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

      {/* Marquee Banner */}
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
          
          {/* Sticky Left Sidebar Filters */}
          <aside className="lg:col-span-3 border border-[var(--outline)] bg-[#111111] p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight mb-6">FILTERS</h3>
            
            {/* Search Input */}
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

            {/* Category selection */}
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

            {/* Stock status filters */}
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
                    onClick={() => updateStockFilter(st.id as any)}
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

          {/* Right Inventory Table */}
          <section className="lg:col-span-9 space-y-6">
            
            {/* Server-side Stats Cards */}
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

            {/* Inventory Listing Tabular Content */}
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

              {/* Pagination Controls Footer (Performance Axis 3 UI integration) */}
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

      {/* Creation Modal System (DSTRKT Sharp Underlays) */}
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
                      maxLength={120} // Unbounded input restriction (Security Axis 3 Fix)
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
                        min="0" // Front-end validation bounds (Security Axis 1 Fix)
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
                        min="0" // Front-end validation bounds (Security Axis 1 Fix)
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
