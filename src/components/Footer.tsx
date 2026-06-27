export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--outline)] bg-[#0f0f0f] py-12 px-8">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="text-lg font-bold tracking-tighter text-white font-display mb-4">DSTRKT // SYSTEM</div>
          <p className="text-zinc-500 text-xs font-mono tracking-wider uppercase">
            A brutalist showcase driven by TanStack Start and TanStack DB. Engineered for maximum technical stability.
          </p>
        </div>
        <div className="flex flex-col md:items-end justify-between gap-4">
          <p className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">
            ©2024 DSTRKT SYSTEM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-4 text-xs font-semibold tracking-widest uppercase">
            <a href="https://tanstack.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">TANSTACK</a>
            <a href="https://github.com/rendoarsandi/aliexpress-dropship" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">SOURCE</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
