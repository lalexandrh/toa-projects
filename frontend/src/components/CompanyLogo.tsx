import { initials } from '../lib/format'

// INTEGRATION SEAM — will connect to the real `Company_Logo` Airtable attachment
// (SPEC.md §5) later. Until then, every company renders a neutral initials avatar
// so the layout reads correctly with zero real logo assets in hand (SPEC.md §12
// flags that no NEVCA/portfolio branding exists yet).
export function CompanyLogo({
  name,
  logoUrl,
  size = 48,
}: {
  name: string
  logoUrl?: string
  size?: number
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="rounded-lg object-cover"
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-slate-200 font-semibold text-slate-600"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
