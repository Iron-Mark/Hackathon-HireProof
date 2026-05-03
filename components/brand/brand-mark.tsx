export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 bg-safe blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
      <svg
        className={`relative z-10 ${className} animate-pulse glitch-hover`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="HireProof logo"
        role="img"
      >
        <rect width="64" height="64" rx="16" fill="#167C5C" />
        <path d="M32 9L50 16V31C50 42.5 43 52 32 56C21 52 14 42.5 14 31V16L32 9Z" fill="#F8FAF7" />
        <path d="M25 25H39" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 33H34" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <circle cx="40" cy="39" r="8" fill="#E7F4EE" stroke="#167C5C" strokeWidth="4" />
        <path d="M45.5 44.5L52 51" stroke="#167C5C" strokeWidth="4" strokeLinecap="round" />
        <path d="M36.5 39L39.5 42L44.5 36.5" stroke="#167C5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute -inset-1 border-2 border-safe/0 group-hover:border-safe/20 rounded-2xl transition-all duration-300 scale-110 opacity-0 group-hover:opacity-100" />
    </div>
  )
}
