import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { KeyRound, ShieldAlert, Cpu, UserPlus, CheckCircle2 } from 'lucide-react'

import { authStore, loginUser, registerUser } from '../utils/authStore'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const auth = useStore(authStore)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Login Form
  const loginForm = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      const ok = await loginUser(value.email, value.password)
      if (ok) {
        navigate({ to: '/' })
      }
    },
  })

  // Register Form
  const registerForm = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      walletId: '',
    },
    onSubmit: async ({ value }) => {
      const ok = await registerUser(value.email, value.fullName, value.password, value.walletId)
      if (ok) {
        setSuccessMsg('EMBARKATION REGISTERED // SESSION DEPLOYED')
        setTimeout(() => {
          setSuccessMsg(null)
          navigate({ to: '/' })
        }, 1500)
      }
    },
  })

  return (
    <main className="min-h-screen bg-[#050505] pt-32 px-8 pb-16 flex items-center justify-center relative overflow-hidden">
      {/* Visual glowing meshes in background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_40%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="w-full max-w-lg border border-white/5 bg-zinc-950/60 backdrop-blur-2xl p-10 relative">
        {/* Subtle geometric line on top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

        {/* Brand/Indicator */}
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-5">
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
            <Cpu className="h-3.5 w-3.5" />
            <span>OPERATIVE SIGN-ON PROTOCOL</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="mb-6 border border-white/20 bg-white/5 p-4 flex items-center gap-3 font-mono text-xs text-white uppercase">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {auth.error && (
          <div className="mb-6 border border-red-500/20 bg-red-950/20 p-4 flex items-center gap-3 font-mono text-xs text-red-400 uppercase">
            <ShieldAlert className="h-4 w-4" />
            <span>{auth.error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          <button
            onClick={() => {
              setMode('login')
              authStore.setState((s) => ({ ...s, error: null }))
            }}
            className={`font-mono text-[10px] tracking-widest py-3.5 transition-all uppercase border ${
              mode === 'login'
                ? 'border-white bg-white text-black font-bold'
                : 'border-white/5 bg-zinc-900/20 text-zinc-400 hover:text-white'
            }`}
          >
            [01 // SIGN IN]
          </button>
          <button
            onClick={() => {
              setMode('register')
              authStore.setState((s) => ({ ...s, error: null }))
            }}
            className={`font-mono text-[10px] tracking-widest py-3.5 transition-all uppercase border ${
              mode === 'register'
                ? 'border-white bg-white text-black font-bold'
                : 'border-white/5 bg-zinc-900/20 text-zinc-400 hover:text-white'
            }`}
          >
            [02 // ENROLL]
          </button>
        </div>

        {/* Form rendering */}
        {mode === 'login' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              loginForm.handleSubmit()
            }}
            className="space-y-6 font-mono text-xs text-white"
          >
            <div className="space-y-2">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                OPERATIVE SECTOR E-MAIL
              </label>
              <loginForm.Field
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

            <div className="space-y-2">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                SECURITY ACCESS CREDENTIALS
              </label>
              <loginForm.Field
                name="password"
                children={(field) => (
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                )}
              />
            </div>

            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-full bg-white text-black font-mono text-xs tracking-widest py-4.5 hover:bg-zinc-200 transition-all duration-300 font-bold flex items-center justify-center gap-2 uppercase disabled:opacity-30 border border-white"
            >
              {auth.isLoading ? (
                <span>DECRYPTING PASS SIGNATURE...</span>
              ) : (
                <>
                  <span>DECRYPT ACCESS KEY</span>
                  <KeyRound className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              registerForm.handleSubmit()
            }}
            className="space-y-5 font-mono text-xs text-white"
          >
            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                OPERATIVE FULL NAME
              </label>
              <registerForm.Field
                name="fullName"
                children={(field) => (
                  <input
                    type="text"
                    placeholder="e.g. ALEX CHEN"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                SECTOR EMAIL
              </label>
              <registerForm.Field
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

            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                ACCESS KEY密码 (PASSWORD)
              </label>
              <registerForm.Field
                name="password"
                children={(field) => (
                  <input
                    type="password"
                    placeholder="MINIMUM 8 CHARACTERS"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                    required
                    minLength={8}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] tracking-widest text-zinc-500 block uppercase">
                WEB3 WALLET SIGNATURE ID (OPTIONAL)
              </label>
              <registerForm.Field
                name="walletId"
                children={(field) => (
                  <input
                    type="text"
                    placeholder="0x... (OR AUTO GENERATE)"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white p-3.5 focus:outline-none focus:border-white transition-colors"
                  />
                )}
              />
            </div>

            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-full bg-white text-black font-mono text-xs tracking-widest py-4.5 hover:bg-zinc-200 transition-all duration-300 font-bold flex items-center justify-center gap-2 uppercase disabled:opacity-30 border border-white"
            >
              {auth.isLoading ? (
                <span>ENROLLING OPERATIVE PARAMETERS...</span>
              ) : (
                <>
                  <span>CREATE SIGNATURE ENROLLMENT</span>
                  <UserPlus className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom indicator terms */}
        <div className="mt-8 pt-5 border-t border-white/5 text-[8px] font-mono text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
          By signing on, you authorize technical telemetry routing on the neometropolis mesh.
        </div>
      </div>
    </main>
  )
}
