import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import { User, Mail, MapPin, Wallet, Calendar, ShieldCheck, Loader2, Save, LogOut } from 'lucide-react'

import { authStore, logoutUser } from '../utils/authStore'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const auth = useStore(authStore)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth.user) {
      navigate({ to: '/auth' })
    }
  }, [auth.user, navigate])

  const form = useForm({
    defaultValues: {
      fullName: auth.user?.fullName || '',
      email: auth.user?.email || '',
      shippingAddress: auth.user?.shippingAddress || '',
      walletId: auth.user?.walletId || '',
    },
    onSubmit: async ({ value }) => {
      if (!auth.user) return
      setIsSaving(true)
      await new Promise((r) => setTimeout(r, 800)) // simulate secure write

      const updatedUser = {
        ...auth.user,
        fullName: value.fullName,
        shippingAddress: value.shippingAddress,
        walletId: value.walletId,
      }

      // Update authStore and localStorage
      authStore.setState((s) => ({ ...s, user: updatedUser }))
      window.localStorage.setItem('dstrkt_session', JSON.stringify(updatedUser))

      // Also update in registered users database
      try {
        const storedUsers = window.localStorage.getItem('dstrkt_registered_users')
        if (storedUsers) {
          const users = JSON.parse(storedUsers)
          const normalizedEmail = auth.user.email.toLowerCase()
          if (users[normalizedEmail]) {
            users[normalizedEmail] = {
              ...users[normalizedEmail],
              fullName: value.fullName,
              walletId: value.walletId,
            }
            window.localStorage.setItem('dstrkt_registered_users', JSON.stringify(users))
          }
        }
      } catch {
        // ignore
      }

      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    },
  })

  // Sync form default values if they are loaded asynchronously
  useEffect(() => {
    if (auth.user) {
      form.reset({
        fullName: auth.user.fullName,
        email: auth.user.email,
        shippingAddress: auth.user.shippingAddress || '',
        walletId: auth.user.walletId || '',
      })
    }
  }, [auth.user, form])

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16 flex items-center justify-center font-mono">
        <div className="border border-white/10 bg-zinc-950/40 p-8 text-center max-w-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500 mb-4" />
          <span>ESTABLISHING SESSION LINK...</span>
        </div>
      </main>
    )
  }

  const handleLogout = () => {
    logoutUser()
    navigate({ to: '/' })
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white font-mono text-[10px] tracking-widest uppercase mb-12"
        >
          <span>[RETURN TO STOREFRONT CATALOG]</span>
        </Link>

        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-12 border-b border-white/5 pb-8">
          <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase block">
            IDENTITY CONSOLE
          </span>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
              OPERATIVE METRICS
            </h1>
            <button
              onClick={handleLogout}
              className="border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-mono text-[10px] tracking-widest px-4 py-2 uppercase flex items-center gap-2 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>DISCONNECT SESSION</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: General Session Info / Badge */}
          <section className="lg:col-span-4 border border-white/5 bg-zinc-950/20 p-8 flex flex-col justify-between relative overflow-hidden h-fit space-y-8">
            <div className="space-y-6">
              <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 block uppercase border-b border-white/5 pb-3">
                SYSTEM LINK PARAMETERS
              </span>

              {/* Huge Technical Hologram Grid Badge */}
              <div className="relative aspect-square border border-white/5 bg-zinc-900/40 p-6 flex flex-col justify-between font-mono">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_10px]" />
                
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>LOC: GLOBAL_S3</span>
                  <span>ID: #OP-099</span>
                </div>

                <div className="flex flex-col items-center justify-center py-10">
                  <div className="relative h-20 w-20 border border-white/10 rounded-full flex items-center justify-center mb-4">
                    <User className="h-10 w-10 text-white/80" />
                    <div className="absolute inset-0 border border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]" />
                  </div>
                  <span className="font-bold text-white text-sm uppercase tracking-wider">{auth.user.fullName}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">CERTIFIED OPERATIVE</span>
                </div>

                <div className="flex justify-between items-end text-[8px] text-zinc-500">
                  <span>SECURE LAYER ACTIVE</span>
                  <span>SYSTEM_v2.04</span>
                </div>
              </div>

              {/* Secondary details list */}
              <div className="space-y-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 uppercase text-[9px] text-zinc-500">
                    <Calendar className="h-3.5 w-3.5" />
                    JOINED MATRIX
                  </span>
                  <span className="text-white font-semibold">{auth.user.joinedAt}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 uppercase text-[9px] text-zinc-500">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    SECURITY RANK
                  </span>
                  <span className="text-white font-semibold">LEVEL 2 OPERATIVE</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              TELEMETRY ENCRYPTED DEPLOYMENT FLOWS DETECTED
            </div>
          </section>

          {/* Right: Update metrics form */}
          <section className="lg:col-span-8 border border-white/5 bg-zinc-950/40 p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/5">
              <User className="h-4 w-4 text-white" />
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                METRIC CONFIGURATION MATRIX
              </h2>
            </div>

            {saveSuccess && (
              <div className="mb-6 border border-white/20 bg-white/5 p-4 flex items-center gap-3 font-mono text-xs text-white uppercase">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span>SYSTEM CONSOLE RE-SYNCHRONIZATION COMPLETED // SECURE WRITE SUCCESSFUL</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-6 font-mono text-xs text-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                    OPERATIVE FULL NAME
                  </label>
                  <form.Field
                    name="fullName"
                    children={(field) => (
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="e.g. ALEX CHEN"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 text-white pl-11 pr-4 py-3.5 focus:outline-none focus:border-white transition-colors"
                          required
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                    SECTOR EMAIL SIGNATURE (READ ONLY)
                  </label>
                  <form.Field
                    name="email"
                    children={(field) => (
                      <div className="relative opacity-60">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="email"
                          value={field.state.value}
                          disabled
                          className="w-full bg-black/20 border border-white/10 text-zinc-500 pl-11 pr-4 py-3.5 cursor-not-allowed"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                  CRYPTOGRAPHIC WALLET INTERNET KEY
                </label>
                <form.Field
                  name="walletId"
                  children={(field) => (
                    <div className="relative">
                      <Wallet className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="0x..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-11 pr-4 py-3.5 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                  GRID DELIVERY ADDRESS NODE
                </label>
                <form.Field
                  name="shippingAddress"
                  children={(field) => (
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                      <textarea
                        rows={3}
                        placeholder="e.g. GRID-SECTOR 4B, NEOMETROPOLIS"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-11 pr-4 py-3.5 focus:outline-none focus:border-white transition-colors resize-none"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-white text-black font-mono text-xs tracking-widest py-4.5 hover:bg-zinc-200 transition-all duration-300 font-bold flex items-center justify-center gap-2 uppercase disabled:opacity-30 border border-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>COMMITTING SECURE WRITE MEMORY...</span>
                    </>
                  ) : (
                    <>
                      <span>COMMIT METRICS UPDATE</span>
                      <Save className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
