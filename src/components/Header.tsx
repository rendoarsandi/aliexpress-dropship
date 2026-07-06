import { Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { cartStore } from '../utils/store'
import { authStore, logoutUser } from '../utils/authStore'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const navigate = useNavigate()
  const cartItems = useStore(cartStore, (s) => s.items)
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const auth = useStore(authStore)

  const handleLogout = () => {
    logoutUser()
    navigate({ to: '/' })
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[var(--outline)]">
      <nav className="mx-auto max-w-[1440px] px-8 h-full flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display font-extrabold text-2xl tracking-tighter text-white no-underline hover:opacity-100">
            DSTRKT
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[10px] font-semibold tracking-widest uppercase">
            <Link to="/" className="text-white hover:opacity-80" activeProps={{ className: 'border-b border-white pb-1' }}>
              SHOP
            </Link>
            <Link
              to="/cart"
              className="text-zinc-400 hover:text-white flex items-center gap-1.5"
              activeProps={{ className: 'text-white border-b border-white pb-1' }}
            >
              <span>CART</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center bg-white text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {auth.user ? (
              <>
                <Link to="/orders" className="text-zinc-400 hover:text-white" activeProps={{ className: 'text-white border-b border-white pb-1' }}>
                  ORDERS
                </Link>
                <Link to="/profile" className="text-zinc-400 hover:text-white" activeProps={{ className: 'text-white border-b border-white pb-1' }}>
                  PROFILE
                </Link>
              </>
            ) : (
              <Link to="/auth" className="text-zinc-400 hover:text-white" activeProps={{ className: 'text-white border-b border-white pb-1' }}>
                SIGN IN
              </Link>
            )}

            <Link to="/about" className="text-zinc-400 hover:text-white" activeProps={{ className: 'text-white border-b border-white pb-1' }}>
              ABOUT
            </Link>

            <Link to="/admin" className="text-zinc-500 hover:text-white border border-dashed border-zinc-800 px-2 py-0.5 text-[9px]" activeProps={{ className: 'text-white border-white border-solid' }}>
              ADMIN
            </Link>
          </div>
        </div>

        {/* Technical specs in header */}
        <div className="flex items-center gap-6">
          {auth.user ? (
            <div className="hidden lg:flex flex-col text-right font-mono text-[8px] text-zinc-500 uppercase">
              <span>KEY: {auth.user.fullName}</span>
              <button onClick={handleLogout} className="text-white text-left hover:underline p-0 m-0 bg-transparent text-[8px] cursor-pointer font-mono font-bold uppercase">
                [DISCONNECT]
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4 border-r border-zinc-800 pr-6 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              <span>SYS.ID: 099-DSTRKT</span>
              <span>LOC: GLOBAL</span>
            </div>
          )}
          
          <ThemeToggle />
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-300">UTILITY OVERLAY</span>
            <span className="h-2 w-2 bg-white animate-pulse" />
          </div>
        </div>
      </nav>
    </header>
  )
}


