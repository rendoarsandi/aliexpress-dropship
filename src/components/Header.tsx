import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[var(--outline)]">
      <nav className="mx-auto max-w-[1440px] px-8 h-full flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-12">
          <Link to="/" className="font-display font-extrabold text-2xl tracking-tighter text-white no-underline hover:opacity-100">
            DSTRKT
          </Link>
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase">
            <Link to="/" className="text-white hover:opacity-80" activeProps={{ className: 'border-b border-white pb-1' }}>
              SHOP
            </Link>
            <Link to="/about" className="text-zinc-400 hover:text-white" activeProps={{ className: 'text-white border-b border-white pb-1' }}>
              ABOUT
            </Link>
          </div>
        </div>

        {/* Technical specs in header */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 border-r border-zinc-800 pr-6 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            <span>SYS.ID: 099-DSTRKT</span>
            <span>LOC: GLOBAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-300">UTILITY OVERLAY</span>
            <span className="h-2 w-2 bg-white animate-pulse" />
          </div>
        </div>
      </nav>
    </header>
  )
}
