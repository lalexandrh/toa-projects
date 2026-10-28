import { useMemo } from 'react'
import { getCompanies, getJobs } from '../data/getJobs'
import { CompanyLogo } from './CompanyLogo'

// Stub directory per SPEC.md §7 ("Explore companies" entry point, distinct from the
// jobs view). Intentionally minimal — a full company detail page / stage & sector
// filtering can come after the jobs-view fields and facets are validated.
export function CompaniesPage() {
  const companies = getCompanies()
  const jobs = useMemo(() => getJobs(), [])
  const activeJobCountByCompany = useMemo(() => {
    const counts = new Map<string, number>()
    for (const job of jobs) {
      counts.set(job.companyId, (counts.get(job.companyId) ?? 0) + 1)
    }
    return counts
  }, [jobs])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Participating companies</h1>
      <p className="mt-1 text-sm text-slate-500">
        NEVCA portfolio companies currently represented in the directory. (Stub page —
        stage/sector filters and company detail views are not yet built.)
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <div key={company.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{company.name}</p>
              <p className="text-xs text-slate-500">
                {company.fundingStage} &middot; {company.primaryVertical}
              </p>
              <p className="text-xs text-slate-500">{company.headquartersCity}</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeJobCountByCompany.get(company.id) ?? 0} active role
                {activeJobCountByCompany.get(company.id) === 1 ? '' : 's'} &middot; Backed by{' '}
                {company.sponsoringVCs.join(' & ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
