// INTEGRATION SEAM — SPEC.md §5 defines Apply_URL as a formula that appends
// `?source=nevca_talent` (or the cooperative's chosen tracking param) to the
// original Job_URL. Centralizing it here means swapping in the real Airtable
// `Apply_URL` field later is a one-function change.

import type { Job } from '../types'

export function buildApplyUrl(job: Job): string {
  const separator = job.sourceUrl.includes('?') ? '&' : '?'
  return `${job.sourceUrl}${separator}source=nevca_talent`
}
