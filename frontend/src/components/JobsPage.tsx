import { useMemo, useState } from 'react'
import { getJobs } from '../data/getJobs'
import { createEmptyFilterState, filterJobs } from '../lib/filterJobs'
import { FilterSidebar } from './FilterSidebar'
import { JobCard } from './JobCard'
import { SearchHero } from './SearchHero'

const PAGE_SIZE = 8

export function JobsPage() {
  const allJobs = useMemo(() => getJobs(), [])
  const [filters, setFilters] = useState(createEmptyFilterState)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => filterJobs(allJobs, filters), [allJobs, filters])
  const visible = filtered.slice(0, visibleCount)

  function updateFilters(next: typeof filters) {
    setFilters(next)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      <SearchHero
        query={filters.query}
        onQueryChange={(query) => updateFilters({ ...filters, query })}
        locationQuery={filters.locationQuery}
        onLocationChange={(locationQuery) => updateFilters({ ...filters, locationQuery })}
        workplaceMode={filters.workplaceMode}
        onWorkplaceModeChange={(workplaceMode) => updateFilters({ ...filters, workplaceMode })}
        resultCount={filtered.length}
      />

      <div className="mx-auto max-w-6xl gap-8 px-6 py-8 md:flex">
        <FilterSidebar filters={filters} onChange={updateFilters} />

        <div className="min-w-0 flex-1">
          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No roles match these filters yet. Try widening your search — this is
              exactly the kind of gap worth flagging during review.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {visible.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
