import type {
  EquityTier,
  FacilityType,
  FundingStage,
  Job,
  JobFunction,
  Seniority,
  TechnicalDomain,
  TransitCorridor,
  Vertical,
  WorkplaceType,
} from '../types'

export type WorkplaceMode = 'All' | 'On-site' | 'Hybrid' | 'Remote'

export interface FilterState {
  query: string
  locationQuery: string
  workplaceMode: WorkplaceMode
  transitCorridors: Set<TransitCorridor>
  jobFunctions: Set<JobFunction>
  fundingStages: Set<FundingStage>
  verticals: Set<Vertical>
  seniorities: Set<Seniority>
  facilityTypes: Set<FacilityType>
  equityTiers: Set<EquityTier>
  technicalDomains: Set<TechnicalDomain>
  foundingOnly: boolean
}

export function createEmptyFilterState(): FilterState {
  return {
    query: '',
    locationQuery: '',
    workplaceMode: 'All',
    transitCorridors: new Set(),
    jobFunctions: new Set(),
    fundingStages: new Set(),
    verticals: new Set(),
    seniorities: new Set(),
    facilityTypes: new Set(),
    equityTiers: new Set(),
    technicalDomains: new Set(),
    foundingOnly: false,
  }
}

function matchesWorkplaceMode(workplaceType: WorkplaceType, mode: WorkplaceMode): boolean {
  if (mode === 'All') return true
  if (mode === 'On-site') return workplaceType === 'Strictly On-site'
  if (mode === 'Remote') return workplaceType === 'Remote (MA-Only)'
  return workplaceType === 'Hybrid (1-2 days/wk)' || workplaceType === 'Hybrid (3-4 days/wk)'
}

export function filterJobs(jobs: Job[], filters: FilterState): Job[] {
  const query = filters.query.trim().toLowerCase()
  const locationQuery = filters.locationQuery.trim().toLowerCase()

  return jobs.filter((job) => {
    if (query) {
      const haystack = `${job.title} ${job.companyName}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (locationQuery) {
      const haystack = `${job.headquartersCity} ${job.transitCorridor}`.toLowerCase()
      if (!haystack.includes(locationQuery)) return false
    }

    if (!matchesWorkplaceMode(job.workplaceType, filters.workplaceMode)) return false

    if (filters.transitCorridors.size && !filters.transitCorridors.has(job.transitCorridor)) {
      return false
    }
    if (filters.jobFunctions.size && !filters.jobFunctions.has(job.jobFunction)) return false
    if (filters.fundingStages.size && !filters.fundingStages.has(job.fundingStage)) return false
    if (
      filters.verticals.size &&
      !(
        filters.verticals.has(job.primaryVertical) ||
        job.secondaryVerticals.some((v) => filters.verticals.has(v))
      )
    ) {
      return false
    }
    if (filters.seniorities.size && !filters.seniorities.has(job.seniority)) return false
    if (
      filters.facilityTypes.size &&
      !filters.facilityTypes.has(job.resolvedFacilityType)
    ) {
      return false
    }
    if (
      filters.equityTiers.size &&
      (!job.equityTier || !filters.equityTiers.has(job.equityTier))
    ) {
      return false
    }
    if (
      filters.technicalDomains.size &&
      !(job.technicalDomain ?? []).some((d) => filters.technicalDomains.has(d))
    ) {
      return false
    }
    if (filters.foundingOnly && !job.isFoundingRole) return false

    return true
  })
}
