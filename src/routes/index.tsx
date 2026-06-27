import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useLiveQuery } from '@tanstack/react-db'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { Plus, Trash, RotateCcw, ShieldCheck, Box, Search, Tag, Cpu } from 'lucide-react'

import { techWearCollection } from '../utils/db'
import type { TechWearItem } from '../utils/db'
import {
  dashboardStore,
  updateSearchQuery,
  updateCategory,
  updateStockFilter,
  toggleCreateModal
} from '../utils/store'
import type { DashboardState } from '../utils/store'

export const Route = createFileRoute('/')({ component: Dashboard })

const columnHelper = createColumnHelper<TechWearItem>()

function Dashboard() {
  // 1. TanStack Store: Get global dashboard state reactively
  const searchQuery = useStore(dashboardStore, (s) => s.searchQuery)
  const selectedCategory = useStore(dashboardStore, (s) => s.selectedCategory)
  const stockFilter = useStore(dashboardStore, (s) => s.stockFilter)
  const isCreateModalOpen = useStore(dashboardStore, (s) => s.isCreateModalOpen)

  // 2. TanStack Query: Fetch server-side statistics mock with cache
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['storeStats'],
    queryFn: async () => {
      // Simulate API call latency
      await new Promise((resolve) => setTimeout(resolve, 800))
      return {
        activeUsers: 184,
        hourlySales: '1.48 ETH',
        conversionRate: '4.12%',
        cloudflareStatus: 'Operational (LAX)'
      }
    }
  })

  // 3. TanStack DB: Subscribe to local collection reactively via Live Query
  const { data: rawItems = [] } = useLiveQuery((q) => q.from({ items: techWearCollection }))

  // Filter items in memory using TanStack Store filter parameters
  const filteredItems = rawItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in-stock' && item.stock > 5) ||
      (stockFilter === 'low-stock' && item.stock > 0 && item.stock <= 5) ||
      (stockFilter === 'out-of-stock' && item.stock === 0)

    return matchesSearch && matchesCategory && matchesStock
  })

  // 4. TanStack Table: Client-side sorting and column headers state
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: (info) => <span className="font-mono text-zinc-500 text-xs">#{info.getValue()}</span>
    }),
    columnHelper.accessor('name', {
      header: 'Product Name',
      cell: (info) => <span className="font-semibold text-zinc-100">{info.getValue()}</span>
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => (
        <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-300">
          <Tag className="h-3 w-3" />
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: (info) => <span className="font-mono text-cyan-400 font-medium">${info.getValue()}</span>
    }),
    columnHelper.accessor('stock', {
      header: 'Stock',
      cell: (info) => {
        const stock = info.getValue()
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-100">{stock} units</span>
            <div className="h-1.5 w-12 overflow-hidden rounded bg-zinc-800">
              <div
                className={`h-full rounded transition-all ${
                  stock > 5 ? 'bg-emerald-500' : stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
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
          'In Stock': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'Low Stock': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          'Out of Stock': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
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
              className="rounded bg-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition"
            >
              <Cpu className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => techWearCollection.delete(id)}
              title="Delete Item"
              className="rounded bg-zinc-800 p-1.5 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200 transition"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      }
    })
  ]

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  // 5. TanStack Form: Type-safe form validation for adding new Tech Wear product
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
      const newItem: TechWearItem = {
        id: (rawItems.length + 1).toString(),
        name: value.name,
        category: value.category,
        price: priceNum,
        stock: stockNum,
        status: stockNum > 5 ? 'In Stock' : stockNum > 0 ? 'Low Stock' : 'Out of Stock'
      }

      // Mutation inside TanStack DB Collection
      techWearCollection.insert(newItem)
      form.reset()
      toggleCreateModal(false)
    }
  })

  return (
    <main className="min-h-screen px-4 pb-16 pt-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Glow Backdrops */}
      <div className="absolute top-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Title Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-mono tracking-[0.2em] text-cyan-400 uppercase">DSTRKT System 24/25</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mt-1">Stock & Inventory Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-2">
            A cohesive real-time showcase of all TanStack libraries running natively on a Cloudflare target environment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1 text-xs text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Cloudflare Deployment Active
          </span>
          <button
            onClick={() => {
              // Reset TanStack DB with Initial items
              rawItems.forEach((it) => techWearCollection.delete(it.id))
              initialItems.forEach((it) => techWearCollection.insert(it))
            }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset DB
          </button>
        </div>
      </header>

      {/* TanStack Query Section: Market Indicators */}
      <section className="mb-10">
        <h2 className="text-xs font-mono tracking-wider text-zinc-400 uppercase mb-4 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          Server Cache Indicators (via TanStack Query)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isStatsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-[100px]" />
            ))
          ) : (
            <>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 transition hover:border-zinc-700/80">
                <p className="text-xs font-medium text-zinc-400">Hourly Market Volume</p>
                <p className="text-2xl font-bold font-mono text-zinc-100 mt-2">{stats?.hourlySales}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 transition hover:border-zinc-700/80">
                <p className="text-xs font-medium text-zinc-400">Concurrent Visitors</p>
                <p className="text-2xl font-bold font-mono text-cyan-400 mt-2">{stats?.activeUsers}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 transition hover:border-zinc-700/80">
                <p className="text-xs font-medium text-zinc-400">Cart Conversion Rate</p>
                <p className="text-2xl font-bold font-mono text-indigo-400 mt-2">{stats?.conversionRate}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 transition hover:border-zinc-700/80">
                <p className="text-xs font-medium text-zinc-400">Network Edge Node</p>
                <p className="text-sm font-semibold font-mono text-emerald-400 mt-3 truncate">{stats?.cloudflareStatus}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Panel Section */}
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Filters Panel (TanStack Store Controller) */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-md">
            <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-1.5">
              <Search className="h-4 w-4 text-cyan-400" />
              Store Controls
            </h2>
            
            {/* Input Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Search Products</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => updateSearchQuery(e.target.value)}
                    placeholder="Filter by name..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Category</label>
                <div className="flex flex-col gap-1">
                  {['All', 'Jackets', 'Pants', 'Accessories', 'Underwear', 'Footwear'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => updateCategory(cat)}
                      className={`text-left rounded px-3 py-1.5 text-xs font-medium transition ${
                        selectedCategory === cat
                          ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => updateStockFilter(e.target.value as DashboardState['stockFilter'])}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition"
                >
                  <option value="all">All Inventory</option>
                  <option value="in-stock">In Stock (&gt;5 units)</option>
                  <option value="low-stock">Low Stock (1-5 units)</option>
                  <option value="out-of-stock">Out of Stock (0 units)</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Inventory Table (TanStack Table & DB) */}
        <section className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-cyan-400" />
                <h2 className="font-bold text-zinc-100">Live DB Products ({filteredItems.length})</h2>
              </div>
              <button
                onClick={() => toggleCreateModal(true)}
                className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-cyan-400 transition"
              >
                <Plus className="h-4 w-4" />
                New Product
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-mono uppercase tracking-wider text-zinc-400">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 font-semibold select-none cursor-pointer hover:text-cyan-400 transition"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500">
                        No products match the selected criteria. Try adjusting your search or filters.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-800/20 transition-all">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Documentation Card */}
      <footer className="mt-12 rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-zinc-950/80 to-zinc-900/30 p-6 md:p-8 backdrop-blur-md">
        <h3 className="font-bold text-zinc-100 flex items-center gap-2 mb-4 text-base">
          <Cpu className="h-5 w-5 text-cyan-400" />
          Technical Showcase: Suite of 9 Integrated TanStack Libraries
        </h3>
        <p className="text-zinc-400 text-sm mb-6 max-w-3xl leading-relaxed">
          This system architecture unites 9 core TanStack tools into a unified, lightweight package, proving that TanStack is a comprehensive, production-grade ecosystem. Here's how each library is demonstrated in real-time above:
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['TanStack Start', 'Orchestrates Server-Side Rendering (SSR), asset pipelines, and hydrations natively targeting Cloudflare.'],
            ['TanStack Router', 'Declares fully type-safe layout bounds and clients-side hydration links for responsive screen flows.'],
            ['TanStack DB', 'Maintains a reactive in-memory collection (`techWearCollection`). Performs live queries using the `useLiveQuery` hook.'],
            ['TanStack Query', 'Fetches mock hourly sales, concurrent traffic, and node health from edge APIs with cache invalidations.'],
            ['TanStack Store', 'Shares and coordinates the global filters, categories, and sidebar search across separate modular views.'],
            ['TanStack Table', 'Provides column declarations, sort configurations, and reactive grid outputs based on active query arrays.'],
            ['TanStack Form', 'Validates local forms (product insertions) with robust touch indicators and type-safe schema constraints.'],
            ['TanStack CLI', 'Bootstrapped the blank template, wired up custom presets, and initialized workspace directories.'],
            ['TanStack Intent', 'Injected persistent instructions to let the coding agent accurately align with library-shipped specifications.']
          ].map(([libName, desc]) => (
            <div key={libName} className="rounded-lg border border-zinc-900 bg-zinc-950/40 p-4 transition hover:border-zinc-800">
              <span className="font-mono text-xs text-cyan-400 font-bold uppercase">{libName}</span>
              <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </footer>

      {/* 6. Form Drawer Modal Backdrop */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Register Inventory Item</h3>
            <p className="text-xs text-zinc-400 mb-6">Create a product inside the live TanStack DB reactive collection.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              {/* Product Name Field */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (!value ? 'Product name is required' : value.length < 3 ? 'Name must be at least 3 chars' : undefined)
                }}
              >
                {(field) => (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Product Name</label>
                    <input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. O-03 Obsidian Cap"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length ? (
                      <p className="text-xs text-rose-400 mt-1 font-mono">{field.state.meta.errors.join(', ')}</p>
                    ) : null}
                  </div>
                )}
              </form.Field>

              {/* Category Field */}
              <form.Field name="category">
                {(field) => (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition"
                    >
                      <option value="Jackets">Jackets</option>
                      <option value="Pants">Pants</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Underwear">Underwear</option>
                      <option value="Footwear">Footwear</option>
                    </select>
                  </div>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                {/* Price Field */}
                <form.Field
                  name="price"
                  validators={{
                    onChange: ({ value }) => (!value ? 'Required' : isNaN(Number(value)) ? 'Must be a number' : undefined)
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Price ($)</label>
                      <input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="299"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length ? (
                        <p className="text-xs text-rose-400 mt-1 font-mono">{field.state.meta.errors.join(', ')}</p>
                      ) : null}
                    </div>
                  )}
                </form.Field>

                {/* Stock Field */}
                <form.Field
                  name="stock"
                  validators={{
                    onChange: ({ value }) => (!value ? 'Required' : isNaN(Number(value)) ? 'Must be a number' : undefined)
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Stock Count</label>
                      <input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="10"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length ? (
                        <p className="text-xs text-rose-400 mt-1 font-mono">{field.state.meta.errors.join(', ')}</p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => toggleCreateModal(false)}
                  className="rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-zinc-950 hover:bg-cyan-400 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
