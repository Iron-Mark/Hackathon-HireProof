export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-[var(--hireproof-brand-lime)] blur-lg opacity-35 transition-opacity duration-500 group-hover:opacity-55" />
      <img
        src="/downloads/hireproof-hp-shield-bot-icon.png"
        alt="HireProof HP shield bot logo"
        className="relative z-10 h-full w-full rounded-2xl object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.35)]"
      />
      <div className="absolute -inset-1 rounded-2xl border-2 border-safe/0 opacity-0 transition-all duration-300 group-hover:border-[color:var(--hireproof-brand-lime)] group-hover:opacity-100" />
    </div>
  )
}
export function BrandWordmark({ className = 'text-lg' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-foreground ${className}`} aria-label="HireProof">
      <span>Hire</span>
      <span style={{ color: 'var(--hireproof-wordmark-proof, #12864F)', textShadow: 'var(--hireproof-wordmark-glow)' }}>Proof</span>
    </span>
  )
}
