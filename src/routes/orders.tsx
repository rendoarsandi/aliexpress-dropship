import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useState, useEffect } from 'react'
import { Package, MapPin, Truck, CheckCircle, Terminal, Cpu, RefreshCw, Layers } from 'lucide-react'

import { ordersStore } from '../utils/store'
import { authStore } from '../utils/authStore'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const navigate = useNavigate()
  const auth = useStore(authStore)
  const { orders } = useStore(ordersStore)
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth.user) {
      navigate({ to: '/auth' })
    }
  }, [auth.user, navigate])

  // Filter orders matching current authenticated user's email
  const userOrders = orders.filter(
    (order) => order.email.toLowerCase() === auth.user?.email.toLowerCase()
  )

  // Auto-select first order if exists
  useEffect(() => {
    if (userOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(userOrders[0].id)
    }
  }, [userOrders, selectedOrderId])

  const selectedOrder = userOrders.find((o) => o.id === selectedOrderId)

  const handleRefreshTelemetry = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      // Simulate adding a new telemetry log to the selected order on refresh
      if (selectedOrder) {
        const newLogs = [
          'SECURE RE-SYNCHRONIZATION SIGNAL EMITTED',
          'TELEMETRY GRID POSITIONING VERIFIED: 35.6762° N',
          `ROUTING DRIFT OFFSET CHECKED: ${Math.random().toFixed(4)}% CORRECT`
        ]
        const updatedOrders = orders.map((o) => {
          if (o.id === selectedOrder.id) {
            // Avoid duplicate additions
            const uniqueLogs = newLogs.filter((log) => !o.telemetryLogs.includes(log))
            return {
              ...o,
              telemetryLogs: [...o.telemetryLogs, ...uniqueLogs]
            }
          }
          return o
        })
        ordersStore.setState((s) => ({ ...s, orders: updatedOrders }))
        window.localStorage.setItem('dstrkt_orders', JSON.stringify({ orders: updatedOrders }))
      }
    }, 1000)
  }

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16 flex items-center justify-center font-mono">
        <div className="border border-white/10 bg-zinc-950/40 p-8 text-center max-w-sm">
          <span>SECURE LINK RETRIEVAL...</span>
        </div>
      </main>
    )
  }

  // Visual status map
  const statusSteps = [
    { id: 'QUEUED FOR ROUTING', label: 'QUEUED', desc: 'Secure debit confirmed, dispatch queue allocated', icon: Terminal },
    { id: 'INTEGRATING FABRIC', label: 'INTEGRATING', desc: 'Fabric matrices configured, thermal layering verified', icon: Layers },
    { id: 'OUT FOR DELIVERY', label: 'OUT ROUTING', desc: 'Active dispatch carrier in transit on the neometropolis grid', icon: Truck },
    { id: 'NODE DELIVERED', label: 'DELIVERED', desc: 'Committed to grid delivery destination', icon: CheckCircle }
  ]

  const getStepIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.id === status)
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-mono text-[10px] tracking-widest uppercase mb-12"
        >
          <span>[BACK TO STOREFRONT CATALOG]</span>
        </Link>

        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-12 border-b border-white/5 pb-8">
          <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase block">
            SHIPPING DEPLOYMENT
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
            ORDER TELEMETRY TRACING
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar: Order manifests list */}
          <aside className="lg:col-span-4 border border-white/5 bg-zinc-950/20 p-6 h-fit space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 block mb-1 uppercase">
                ACTIVE TRANSACTIONS
              </span>
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                MANIFEST ARCHIVES
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {userOrders.length > 0 ? (
                userOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`text-left p-4 font-mono transition-all border ${
                      selectedOrderId === order.id
                        ? 'border-white bg-zinc-900/60'
                        : 'border-white/5 bg-zinc-950/40 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-white">{order.id}</span>
                      <span className="inline-flex items-center border border-white/10 px-2 py-0.5 text-[8px] text-zinc-400 uppercase font-semibold">
                        {order.status.replace(' FOR ROUTING', '')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>TOTAL: ${order.total} USD</span>
                      <span>{new Date(order.placedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="border border-dashed border-white/10 p-10 text-center font-mono space-y-4">
                  <Package className="h-8 w-8 text-zinc-600 mx-auto animate-pulse" />
                  <span className="text-zinc-500 text-xs block uppercase">NO SHIPMENTS DEPLOYED</span>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider">
                    Place an order first to initiate secure delivery pipelines.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex border border-white/10 bg-zinc-950/40 hover:bg-white hover:text-black px-4 py-2 text-[10px] text-white uppercase font-bold"
                  >
                    DEPLOY SOME PAYLOADS
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Right Area: Interactive Shipment Tracker Console */}
          {selectedOrder ? (
            <section className="lg:col-span-8 space-y-8">
              {/* Telemetry Progress Header */}
              <div className="border border-white/5 bg-zinc-950/40 p-8 lg:p-10 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 block uppercase">
                      TELEMETRY LINK STATUS
                    </span>
                    <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-1">
                      <Cpu className="h-4.5 w-4.5" />
                      <span>SECURE RECORD: {selectedOrder.id}</span>
                    </h2>
                  </div>

                  <button
                    onClick={handleRefreshTelemetry}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 border border-white/10 hover:border-white/30 bg-zinc-900/40 hover:bg-zinc-900/60 px-4 py-2 font-mono text-[10px] text-white uppercase tracking-wider transition"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>REFRESH DEPLOYMENT LOGS</span>
                  </button>
                </div>

                {/* 1. Stunning Progressive Delivery Timeline */}
                <div className="space-y-6">
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 block uppercase">
                    DEPLOYMENT PIPELINE METRICS
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                    {/* Horizontal connecting vector line for desktop */}
                    <div className="absolute top-[21px] left-[12%] right-[12%] h-[1px] bg-white/10 hidden md:block z-0" />
                    
                    {/* Visual highlighted progress line fill */}
                    <div
                      className="absolute top-[21px] left-[12%] h-[1px] bg-white hidden md:block z-0 transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, (getStepIndex(selectedOrder.status) / 3) * 76)}%`
                      }}
                    />

                    {statusSteps.map((step, idx) => {
                      const StepIcon = step.icon
                      const isCompleted = idx <= getStepIndex(selectedOrder.status)
                      const isActive = idx === getStepIndex(selectedOrder.status)

                      return (
                        <div key={step.id} className="flex md:flex-col gap-4 md:items-center text-left md:text-center z-10">
                          {/* Circle indicator */}
                          <div
                            className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all duration-500 ${
                              isActive
                                ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                                : isCompleted
                                ? 'border-white bg-zinc-900 text-white'
                                : 'border-white/5 bg-zinc-950 text-zinc-600'
                            }`}
                          >
                            <StepIcon className="h-4.5 w-4.5" />
                          </div>

                          <div className="space-y-1">
                            <span className={`font-mono text-[10px] tracking-wider uppercase block font-bold ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                              {step.label}
                            </span>
                            <p className="text-[10px] font-mono text-zinc-500 leading-normal uppercase">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 2. Simulated Live Telemetry Log Terminal */}
                <div className="border border-white/5 bg-zinc-950/40 p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-mono text-[10px] tracking-widest text-zinc-400 block uppercase">
                      TELEMETRY DATA STREAM
                    </span>
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                  </div>

                  {/* Terminal console box */}
                  <div className="bg-black/50 border border-white/5 p-4 h-[240px] overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-2.5 flex flex-col justify-end">
                    <div className="text-zinc-600">-- SECURE SIGNAL DEPLOYED --</div>
                    {selectedOrder.telemetryLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start leading-relaxed uppercase">
                        <span className="text-white shrink-0">&gt;</span>
                        <span className={index === selectedOrder.telemetryLogs.length - 1 ? 'text-white font-bold' : ''}>
                          {log}
                        </span>
                      </div>
                    ))}
                    {isRefreshing && (
                      <div className="flex gap-2 items-center text-zinc-500 animate-pulse uppercase">
                        <span>&gt; INTERCEPTING BROADCAST CODES...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Payload detail summary */}
                <div className="border border-white/5 bg-zinc-950/40 p-6 space-y-4 font-mono text-xs">
                  <span className="text-[10px] tracking-widest text-zinc-400 block uppercase border-b border-white/5 pb-3">
                    DELIVERY PARAMETERS Manifest
                  </span>

                  <div className="space-y-3 text-zinc-400">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-zinc-500 uppercase block">NODE COORDINATES</span>
                        <span className="text-white uppercase leading-normal">{selectedOrder.shippingAddress}</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <span className="text-[9px] text-zinc-500 uppercase block mb-1">SPECIMEN PAYLOADS</span>
                      {selectedOrder.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-white font-semibold uppercase">{it.name} (×{it.quantity})</span>
                          <span className="text-zinc-500">${it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/5 pt-3 flex justify-between text-xs font-bold">
                      <span className="text-zinc-500 uppercase">DEBIT TOTAL</span>
                      <span className="text-white">${selectedOrder.total} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="lg:col-span-8 border border-white/5 bg-zinc-950/40 p-16 text-center font-mono">
              <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4 animate-pulse" />
              <span className="text-white font-bold uppercase block mb-1">NO ORDER MANIFEST INSPECTED</span>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">
                Select an active telemetry token from the sidebar to inspect routing pipelines.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
