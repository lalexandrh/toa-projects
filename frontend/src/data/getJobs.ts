// INTEGRATION SEAM — this is the single chokepoint for job data access. Every
// component reads jobs through `getJobs()`. To wire up the real backend later,
// replace the body of this function with an Airtable API call (or a thin API that
// wraps it) that returns the same `Job[]` shape — no caller changes needed.

import { companies } from './companies'
import { rawJobs } from './rawJobs'
import type { Job } from '../types'

const companiesById = new Map(companies.map((c) => [c.id, c]))

function hydrate(): Job[] {
  return rawJobs.map((raw) => {
    const company = companiesById.get(raw.companyId)
    if (!company) {
      throw new Error(`Mock data error: no company found for id "${raw.companyId}"`)
    }
    return {
      ...raw,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      sponsoringVCs: company.sponsoringVCs,
      fundingStage: company.fundingStage,
      primaryVertical: company.primaryVertical,
      secondaryVerticals: company.secondaryVerticals,
      transitCorridor: company.transitCorridor,
      resolvedFacilityType: raw.facilityType ?? company.facilityType,
      headquartersCity: company.headquartersCity,
      stageVerified: company.recordVerification === 'Verified Golden Record',
    }
  })
}

const hydratedJobs = hydrate()

/** Returns all mock jobs, already "inherited" from their company's golden record. */
export function getJobs(): Job[] {
  return hydratedJobs
}

export function getCompanies() {
  return companies
}
