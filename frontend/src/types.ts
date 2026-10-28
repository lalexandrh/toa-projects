// Canonical field definitions mirror SPEC.md §5 (Job_Postings / Portfolio_Companies)
// and §6 (canonical taxonomy). Keep these option lists in sync with SPEC.md if the
// taxonomy changes — they are the contract the real Airtable base will also use.

export const WORKPLACE_TYPES = [
  'Strictly On-site',
  'Hybrid (1-2 days/wk)',
  'Hybrid (3-4 days/wk)',
  'Remote (MA-Only)',
] as const
export type WorkplaceType = (typeof WORKPLACE_TYPES)[number]

export const TRANSIT_CORRIDORS = [
  'Kendall / Cambridge (Red Line)',
  'Seaport / Innovation District',
  'Downtown / Back Bay (Orange/Green)',
  'Route 128 / MetroWest (Car/Rail)',
  'Route 495 / Outer Suburbs',
  'Remote / Distributed',
] as const
export type TransitCorridor = (typeof TRANSIT_CORRIDORS)[number]

export const FACILITY_TYPES = [
  'Standard Office',
  'Wet Lab / Vivarium',
  'Hardware Lab / Machine Shop',
  'Distributed / Remote',
] as const
export type FacilityType = (typeof FACILITY_TYPES)[number]

export const FUNDING_STAGES = [
  'Pre-Seed / Seed',
  'Series A',
  'Series B',
  'Series C+ / Growth',
  'Bootstrapped / Profitable',
] as const
export type FundingStage = (typeof FUNDING_STAGES)[number]

export const VERTICALS = [
  'Biotech & Life Sciences',
  'Robotics & Hardware',
  'AI & DeepTech',
  'ClimateTech & Clean Energy',
  'Enterprise SaaS',
  'FinTech & InsurTech',
  'HealthTech & Digital Health',
  'Cybersecurity',
] as const
export type Vertical = (typeof VERTICALS)[number]

export const JOB_FUNCTIONS = [
  'Founding & Executive',
  'Machine Learning & AI',
  'Software & Infrastructure',
  'Robotics & Hardware',
  'Biotech & Life Sciences',
  'Product & Design',
  'GTM & Sales',
  'Marketing & Growth',
  'Data & Analytics',
  'Customer Success & Support',
  'Operations, Finance & People',
] as const
export type JobFunction = (typeof JOB_FUNCTIONS)[number]

export const SENIORITIES = [
  'Entry-Level / Associate',
  'Mid-Level',
  'Senior',
  'Lead / Principal',
  'Executive (VP+)',
] as const
export type Seniority = (typeof SENIORITIES)[number]

export const EQUITY_TIERS = [
  'High (>1.0%)',
  'Standard (0.25-1.0%)',
  'Disclosed on Request',
  'N/A',
] as const
export type EquityTier = (typeof EQUITY_TIERS)[number]

export const TECHNICAL_DOMAINS = [
  'Molecular Modeling / TechBio',
  'Physical AI / Robotics',
  'LLM & Multi-Agent Systems',
  'Computer Vision',
  'Distributed Systems',
  'Classical ML / Predictive Analytics',
] as const
export type TechnicalDomain = (typeof TECHNICAL_DOMAINS)[number]

export type RecordVerification =
  | 'Verified Golden Record'
  | 'Unverified (Auto-Generated)'
  | 'Under Review'

// Portfolio_Companies "golden record" (SPEC.md §5). In the real system these fields
// are locked/inherited onto every job from that company via Airtable Lookups.
export interface Company {
  id: string
  name: string
  domain: string
  sponsoringVCs: string[]
  fundingStage: FundingStage
  primaryVertical: Vertical
  secondaryVerticals: Vertical[]
  headquartersCity: string
  transitCorridor: TransitCorridor
  facilityType: FacilityType
  recordVerification: RecordVerification
  // INTEGRATION SEAM — will connect to the real `Company_Logo` Airtable attachment
  // field later. `undefined` here means "no logo yet", which <CompanyLogo> renders
  // as a neutral initials avatar.
  logoUrl?: string
}

// Job-level fields raw-authored in the mock dataset (src/data/jobs.ts). Everything
// that belongs to the company (funding stage, verticals, transit corridor, backers)
// is intentionally NOT duplicated here — it's inherited at read time in
// src/data/getJobs.ts, mirroring the Airtable Lookup-field inheritance model.
export interface RawJobPosting {
  id: string
  companyId: string
  title: string
  workplaceType: WorkplaceType
  facilityType?: FacilityType // per §5: can override the company default per-role
  jobFunction: JobFunction
  seniority: Seniority
  isFoundingRole: boolean
  equityTier?: EquityTier
  technicalDomain?: TechnicalDomain[]
  salaryMin?: number
  salaryMax?: number
  postedAt: string // ISO date
  // INTEGRATION SEAM — the original source-of-record URL (Ashby/Greenhouse/Lever/
  // career page). In production this drives Apply_URL (see src/lib/applyUrl.ts).
  sourceUrl: string
}

// Fully resolved job used by the UI — a RawJobPosting with its company's inherited
// fields flattened in, exactly like a hydrated Airtable record would read once
// Lookups are configured.
export interface Job extends RawJobPosting {
  companyName: string
  companyLogoUrl?: string
  sponsoringVCs: string[]
  fundingStage: FundingStage
  primaryVertical: Vertical
  secondaryVerticals: Vertical[]
  transitCorridor: TransitCorridor
  resolvedFacilityType: FacilityType
  headquartersCity: string
  stageVerified: boolean
}
