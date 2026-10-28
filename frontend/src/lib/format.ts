export function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  return fmt((min ?? max) as number)
}

export function formatRelativeDate(isoDate: string): string {
  const posted = new Date(`${isoDate}T00:00:00`)
  const now = new Date()
  const days = Math.max(
    0,
    Math.round((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)),
  )
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}
