import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-32 px-8 pb-16">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Manifesto */}
        <section className="lg:col-span-7 border border-[var(--outline)] bg-[#111111] p-10 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase mb-4 block">DESIGN MANIFESTO</span>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 uppercase">
              TECHNICAL BRUTALISM
            </h1>
            <p className="text-zinc-300 text-base leading-8 mb-6">
              We strip away ornamental decorators to reveal pure visual structure. Every element is aligned to a strict grid; every border represents a calculated boundary.
            </p>
            <p className="text-zinc-400 text-sm leading-7">
              DSTRKT is built at the intersection of urban shelter and advanced data flow. Driven by a core TanStack engine, our system optimizes collection listings, stores localized status values via TanStack Store, and handles real-time synchronization through reactive TanStack DB live queries.
            </p>
          </div>
          <div className="mt-12 pt-6 border-t border-zinc-800 text-[10px] font-mono tracking-widest text-zinc-500">
            SYSTEM VERSION: 2.1.0-BETA // CORE MODEL ACTIVED
          </div>
        </section>

        {/* Right Reference Panel */}
        <section className="lg:col-span-5 border border-[var(--outline)] bg-[#111111] p-10 flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[11px] font-mono tracking-[0.3em] text-zinc-500 uppercase mb-4 block">SPECIFICATIONS</span>
            <h3 className="font-display text-2xl font-bold tracking-tight text-white mb-6 uppercase">MATERIALS & METRICS</h3>
            <ul className="space-y-4 font-mono text-xs text-zinc-400">
              <li className="flex justify-between border-b border-zinc-800 pb-2">
                <span>SHELL COMPONENT</span>
                <span className="text-white">CORDURA® PRO TYPE-A</span>
              </li>
              <li className="flex justify-between border-b border-zinc-800 pb-2">
                <span>SEAMS JOINTS</span>
                <span className="text-white">REINFORCED TAPED</span>
              </li>
              <li className="flex justify-between border-b border-zinc-800 pb-2">
                <span>DATA CACHE ENGINE</span>
                <span className="text-white">TANSTACK QUERY</span>
              </li>
              <li className="flex justify-between border-b border-zinc-800 pb-2">
                <span>LIVE QUERIES</span>
                <span className="text-white">TANSTACK DB</span>
              </li>
            </ul>
          </div>
          
          {/* Subtle design element */}
          <div className="absolute -bottom-10 -right-10 select-none pointer-events-none opacity-5 font-black font-display text-[150px]">
            SYS
          </div>
        </section>

      </div>
    </main>
  )
}
