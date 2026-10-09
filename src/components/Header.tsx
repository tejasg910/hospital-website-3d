import { BRAND, NAV } from "@/lib/content";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label={`${BRAND.full} — home`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#7fe3d6" />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#06181b" />
      </svg>
      <span className="display text-[1.6rem] leading-none">{BRAND.name}</span>
    </a>
  );
}

export default function Header({ simple, onSimple }: { simple: boolean; onSimple: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="panel flex items-center justify-between gap-3 !rounded-full py-2 pr-2 pl-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 text-[0.88rem] text-[var(--fg-mute)] lg:flex">
          {NAV.slice(0, 4).map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-[var(--fg)]">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimple}
            aria-pressed={simple}
            className="hidden rounded-full px-3 py-2 text-[0.8rem] text-[var(--fg-mute)] shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:text-[var(--fg)] sm:block"
          >
            {simple ? "Full experience" : "Simple view"}
          </button>
          <a href={BRAND.emergencyHref} className="flex items-center gap-2 rounded-full bg-[var(--color-coral)] px-3.5 py-2 text-[0.82rem] font-semibold text-white">
            <span className="pulse" aria-hidden="true" />
            <span className="hidden sm:inline">Emergency</span> {BRAND.emergency}
          </a>
          <a href="#contact" className="hidden rounded-full bg-[var(--color-mint)] px-4 py-2 text-[0.82rem] font-semibold text-[var(--color-ink)] md:block">
            Book a visit
          </a>
        </div>
      </div>
    </header>
  );
}
