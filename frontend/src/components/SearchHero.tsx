import type { WorkplaceMode } from '../lib/filterJobs'

const WORKPLACE_MODES: WorkplaceMode[] = ['All', 'On-site', 'Hybrid', 'Remote']

export function SearchHero({
  query,
  onQueryChange,
  locationQuery,
  onLocationChange,
  workplaceMode,
  onWorkplaceModeChange,
  resultCount,
}: {
  query: string
  onQueryChange: (value: string) => void
  locationQuery: string
  onLocationChange: (value: string) => void
  workplaceMode: WorkplaceMode
  onWorkplaceModeChange: (mode: WorkplaceMode) => void
  resultCount: number
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Find your next role at a Massachusetts-backed startup
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aggregated openings across NEVCA member portfolio companies.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Job title, company, or keyword"
            className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Location (e.g. Cambridge, Waltham, Seaport)"
            className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none md:max-w-xs"
          />
          <div className="flex rounded-md border border-slate-300 p-1">
            {WORKPLACE_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onWorkplaceModeChange(mode)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  workplaceMode === mode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{resultCount}</span>{' '}
          {resultCount === 1 ? 'job' : 'jobs'}
        </p>
      </div>
    </section>
  )
}
