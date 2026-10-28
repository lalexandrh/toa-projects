import {
  EQUITY_TIERS,
  FACILITY_TYPES,
  FUNDING_STAGES,
  JOB_FUNCTIONS,
  SENIORITIES,
  TECHNICAL_DOMAINS,
  TRANSIT_CORRIDORS,
  VERTICALS,
} from '../types'
import type {
  EquityTier,
  FacilityType,
  FundingStage,
  JobFunction,
  Seniority,
  TechnicalDomain,
  TransitCorridor,
  Vertical,
} from '../types'
import { CheckboxGroup } from './CheckboxGroup'
import type { FilterState } from '../lib/filterJobs'

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function FilterSidebar({
  filters,
  onChange,
}: {
  filters: FilterState
  onChange: (filters: FilterState) => void
}) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      <label className="flex items-center gap-2 border-b border-slate-200 py-4 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={filters.foundingOnly}
          onChange={() => onChange({ ...filters, foundingOnly: !filters.foundingOnly })}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        ⚡ Founding roles only
      </label>

      <CheckboxGroup<TransitCorridor>
        label="Transit corridor"
        options={TRANSIT_CORRIDORS}
        selected={filters.transitCorridors}
        onToggle={(v) => onChange({ ...filters, transitCorridors: toggleInSet(filters.transitCorridors, v) })}
      />
      <CheckboxGroup<JobFunction>
        label="Job function"
        options={JOB_FUNCTIONS}
        selected={filters.jobFunctions}
        onToggle={(v) => onChange({ ...filters, jobFunctions: toggleInSet(filters.jobFunctions, v) })}
      />
      <CheckboxGroup<Vertical>
        label="Vertical"
        options={VERTICALS}
        selected={filters.verticals}
        onToggle={(v) => onChange({ ...filters, verticals: toggleInSet(filters.verticals, v) })}
      />
      <CheckboxGroup<FundingStage>
        label="Funding stage"
        options={FUNDING_STAGES}
        selected={filters.fundingStages}
        onToggle={(v) => onChange({ ...filters, fundingStages: toggleInSet(filters.fundingStages, v) })}
      />
      <CheckboxGroup<Seniority>
        label="Seniority"
        options={SENIORITIES}
        selected={filters.seniorities}
        onToggle={(v) => onChange({ ...filters, seniorities: toggleInSet(filters.seniorities, v) })}
      />
      <CheckboxGroup<FacilityType>
        label="Facility type"
        options={FACILITY_TYPES}
        selected={filters.facilityTypes}
        onToggle={(v) => onChange({ ...filters, facilityTypes: toggleInSet(filters.facilityTypes, v) })}
      />
      <CheckboxGroup<EquityTier>
        label="Equity tier"
        options={EQUITY_TIERS}
        selected={filters.equityTiers}
        onToggle={(v) => onChange({ ...filters, equityTiers: toggleInSet(filters.equityTiers, v) })}
      />
      <CheckboxGroup<TechnicalDomain>
        label="Technical domain"
        options={TECHNICAL_DOMAINS}
        selected={filters.technicalDomains}
        onToggle={(v) => onChange({ ...filters, technicalDomains: toggleInSet(filters.technicalDomains, v) })}
      />
    </aside>
  )
}
