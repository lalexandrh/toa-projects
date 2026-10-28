import type { ReactNode } from 'react'
import type { Job } from '../types'
import { buildApplyUrl } from '../lib/applyUrl'
import { formatRelativeDate, formatSalary } from '../lib/format'
import { CompanyLogo } from './CompanyLogo'

export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax)
  const backedBy = job.sponsoringVCs.join(' & ')

  return (
    <article className="flex gap-4 border-b border-slate-200 bg-white p-5 last:border-b-0">
      <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
          {job.isFoundingRole && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              ⚡ Founding Role
            </span>
          )}
          {job.stageVerified ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              ★ {job.fundingStage} Verified
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {job.fundingStage} (inferred)
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm text-slate-600">
          {job.companyName}
          {backedBy && <> &middot; Backed by {backedBy}</>}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          📍 {job.headquartersCity} &middot; {job.transitCorridor} &middot; {job.workplaceType}
          {job.resolvedFacilityType !== 'Standard Office' && (
            <> &middot; {job.resolvedFacilityType}</>
          )}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
          <Tag>{job.jobFunction}</Tag>
          <Tag>{job.seniority}</Tag>
          <Tag>{job.primaryVertical}</Tag>
          {job.secondaryVerticals.map((v) => (
            <Tag key={v}>{v}</Tag>
          ))}
          {job.technicalDomain?.map((d) => <Tag key={d}>{d}</Tag>)}
          {job.equityTier && <Tag>Equity: {job.equityTier}</Tag>}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {salary && <span className="font-medium text-slate-700">{salary}</span>}
            {salary && ' · '}
            Posted {formatRelativeDate(job.postedAt)}
          </p>
          {/* INTEGRATION SEAM — points at a placeholder/sample source URL today;
              buildApplyUrl() is the one place that will read the real Apply_URL
              value (SPEC.md §5) once the backend is live. */}
          <a
            href={buildApplyUrl(job)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Apply on Company Site ↗
          </a>
        </div>
      </div>
    </article>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5">{children}</span>
}
