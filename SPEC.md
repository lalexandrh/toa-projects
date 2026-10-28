# MA Talent Exchange — POC Spec (Source of Truth)

Distilled from `job-aggregator-chat-content.md` (an exploratory chat transcript). That
transcript iterated on the architecture live — earlier turns propose ideas later turns
explicitly supersede. **This document keeps only the final, superseding decisions.**
Agents and sub-agents should treat this file as authoritative and should not pull
concepts from the original chat log without checking them against the
"Superseded — do not implement" section below.

## 1. What this is

A proof-of-concept, **read-only** regional job board aggregating Massachusetts-based
roles across the portfolio companies of **NEVCA** (New England Venture Capital
Association) member VC firms (~88 firms). Goal of the POC: get a working, browsable
prototype in front of NEVCA leadership to secure funding for a full build. Not a
production system yet.

Two work streams follow from this:
1. **The backend/ops architecture** (data model, ingestion, hygiene) — well-specified
   in the source chat, summarized in §3–6 below.
2. **The interactive front end** — the actual artifact the user wants to hand to
   stakeholders so they can poke at it and give feedback on fields/filters/UX. This is
   thin in the source material (one ASCII wireframe) and needs active design work —
   see §7.

## 2. Reuse-first principle

Explicit project constraint: **do not build custom backend infrastructure for the
POC.** Assemble from existing SaaS/low-code tools; only write custom code where no
tool reasonably covers the need (e.g., the LLM normalization prompt, the regex/URL
parsing logic).

| Layer | Tool | Role |
|---|---|---|
| Intake form | Fillout or Softr Forms | Gated submission form (VC code + job URL/text) |
| Orchestration | Make.com | Webhooks, validation, HTTP fetch, routing, scheduling |
| Database | Airtable | Three linked tables (see §5); no custom backend/API |
| Normalization | OpenAI API (gpt-4o-mini), temp 0, JSON-object mode | Converts raw HTML/text into canonical schema |
| Public directory | Softr (or Webflow + Finsweet Filters) bound to Airtable | Faceted search UI, no custom frontend app for the *production* POC path |

Explicitly **not** used for this POC: dedicated search engines (Algolia/Meilisearch/
Elasticsearch), PostGIS/custom geocoding services, a custom backend API/service layer,
OAuth/admin ATS integrations, unified ATS APIs (Merge.dev/Finch/Kombo). These were
discussed for a larger-scale version but are out of scope here (see §8).

Estimated operating cost: **< $100/month** (Airtable Team seat, Softr Pro, Make.com
Pro, OpenAI usage, domain).

## 3. Governance & access model

- Access is controlled at the **VC firm level**, not per company or per email domain.
  Each of the 88 NEVCA member firms gets one unique alphanumeric `Access_Code`
  (e.g., `PLR-NEVCA-26`).
- A firm's talent partner can submit roles directly or hand the code to portfolio
  company recruiters/founders. No portfolio company needs its own account, password,
  or ATS admin/OAuth grant.
- Codes carry submission privileges only (no admin rights), rate-limited to **25
  submissions/hour/code**.
- When a company is backed by multiple NEVCA members (a syndicate), the job listing
  attributes to **all** co-investing firms, not just whichever one submitted it.

## 4. Ingestion: dual-track

**Track 1 — Cold-start seed (one-time, bulk).** Before any stakeholder demo, pull
public ATS endpoints (Greenhouse `/boards/{token}/jobs`, Ashby `/posting-api/job-board/
{org}`, Lever `/v0/postings/{company}`) for ~15 flagship MA portfolio companies, filter
to MA-located roles, and use this (60–100 roles) to pre-populate the directory. This is
the *only* scraping in this spec — scoped, one-time, and company-list-bounded. It
exists purely to avoid demoing an empty directory.

**Track 2 — Event-driven member submissions (ongoing).** A member VC (or delegated
portfolio recruiter) submits a job via the gated form: `vc_code`, `job_url` (Ashby/
Greenhouse/Lever/career page link), optional `raw_text` fallback, optional
`company_name`/`submitter_email`.

Pipeline (Make.com scenario):
1. Webhook receives submission payload.
2. Validate `vc_code` against `VC_Registry` (`Access_Code` match + `Code_Status =
   Active`). No match → HTTP 401, halt.
3. Parse `job_url` to extract `company_domain` / ATS slug (regex).
4. Query `Portfolio_Companies` for a match on domain or slug.
   - **Match found:** link `Company_Ref`; company-level fields (funding stage,
     vertical(s), transit corridor, sponsoring VCs) are inherited via Airtable
     Lookups from this master record — locked, not re-derived per job.
   - **No match:** proceed to LLM inference for company-level fields and create an
     entry in a `Portfolio_Review_Queue` so an admin can later verify/backfill the
     master record for that company.
5. Fetch the raw page (`GET`, browser-like User-Agent, follow redirects). On HTTP 403
   (anti-bot wall), fall back to parsing OpenGraph/meta tags and set
   `Status = Draft / Pending Review` rather than dropping the submission.
6. LLM normalization (gpt-4o-mini, temp 0, JSON-object response) extracts job-level
   fields per the canonical schema (§6) and the prompt rules in §6.1. If
   `is_ma_eligible = false`, reject (`Status = Rejected - Non-MA`); if the parser
   output isn't valid JSON, route to manual review instead of writing bad data.
7. Upsert into `Job_Postings`. `Status = Active`, `Expires_At = now + 45 days`.
8. Webhook responds 200 with the new record ID.

Operational guardrails: Airtable caps at 5 req/sec/base — keep Make.com execution
serial (max bundle size 1) during any bulk/seed run to avoid 429s.

## 5. Data model (Airtable, 3 tables)

Relational inheritance prevents "stage drift" — a job never states its own funding
stage/vertical if the company already has a verified master record.

**`VC_Registry`** (the 88 firms): `Firm_Name` (primary), `Access_Code`,
`Talent_Partner_Name`, `Talent_Partner_Email`, `Code_Status` (Active/Revoked/
Rate-Limited), link → `Portfolio_Companies`, link → `Job_Postings`, rollup
`Active_Jobs_Count`.

**`Portfolio_Companies`** (golden record): `Company_Name` (primary),
`Company_Domain`, `ATS_Slug`, link → `Sponsoring_VCs` (multi, supports syndicates),
`Funding_Stage`, `Primary_Vertical`, `Secondary_Verticals` (multi),
`Headquarters_City`, `Transit_Corridor`, `Facility_Type`, `Company_Logo`,
`Record_Verification` (Verified / Unverified-Auto-Generated / Under Review), link →
`Active_Jobs`.

**`Job_Postings`** (canonical listings): `Job_Title`, `Job_URL`, `Apply_URL` (formula:
appends `?source=nevca_talent`), link → `Company_Ref` (drives the Lookups below),
`Submitted_By_VC` (link), `Workplace_Type`, `Facility_Type` (can override company
default per-role), `Job_Function`, `Is_Founding_Role`, `Technical_Domain` (multi),
`Equity_Tier`, `Salary_Min`/`Salary_Max`, `Status` (Active/Closed/Draft-Pending
Review/Rejected-Non-MA), `Stage_Verification` (formula, flags inferred vs. verified),
`Submission_Date`, `Expires_At`, `Last_Liveness_Check`, `Liveness_HTTP_Code`. Lookups
from `Company_Ref`: company name/logo, `Funding_Stage`, `Primary_Vertical`,
`Secondary_Verticals`, `Transit_Corridor`, `Sponsoring_VCs`.

## 6. Canonical taxonomy (final field list)

These are the fields candidates filter/search by — i.e., this list is the direct input
to the frontend filter design in §7.

| Field | Values | Why it exists |
|---|---|---|
| `workplace_type` | Strictly On-site, Hybrid (1-2 days/wk), Hybrid (3-4 days/wk), Remote (MA-Only) | Clarifies in-office expectation precisely (replaces vague "Hybrid") |
| `transit_corridor` | Kendall/Cambridge (Red Line), Seaport/Innovation District, Downtown/Back Bay (Orange/Green), Route 128/MetroWest (Car/Rail), Route 495/Outer Suburbs, Remote/Distributed | Commute-mode-based geography, not just municipality — the thing MA candidates actually filter on |
| `facility_type` | Standard Office, Wet Lab/Vivarium, Hardware Lab/Machine Shop, Distributed/Remote | Signals physical-infra dependency (bench/lab work can't be "hybrid") |
| `funding_stage` | Pre-Seed/Seed, Series A, Series B, Series C+/Growth, Bootstrapped/Profitable | Risk/equity-tolerance matching for operators |
| `primary_vertical` / `secondary_verticals` | Biotech & Life Sciences, Robotics & Hardware, AI & DeepTech, ClimateTech & Clean Energy, Enterprise SaaS, FinTech & InsurTech, HealthTech & Digital Health, Cybersecurity | Specialist discovery + cross-disciplinary surfacing (multi-select secondary) |
| `job_function` | Founding & Executive, Machine Learning & AI, Software & Infrastructure, Robotics & Hardware, Biotech & Life Sciences, Product & Design, GTM & Sales, Marketing & Growth, Data & Analytics, Customer Success & Support, Operations, Finance & People | Department-level normalization across inconsistent ATS taxonomies |
| `seniority` | Entry-Level/Associate, Mid-Level, Senior, Lead/Principal, Executive (VP+) | Standard level filter |
| `is_founding_role` | boolean | Isolates "employee #1–10" roles |
| `equity_tier` | High (>1.0%), Standard (0.25–1.0%), Disclosed on Request, N/A | Risk-tolerant technical talent filter |
| `technical_domain` (multi) | Molecular Modeling/TechBio, Physical AI/Robotics, LLM & Multi-Agent Systems, Computer Vision, Distributed Systems, Classical ML/Predictive Analytics | Disambiguates generic "ML Engineer" postings |
| `sponsoring_vc` (multi) | validated against VC_Registry | Institutional credibility / "Backed by" badge, supports syndicates |
| `salary_min` / `salary_max` | USD | Compensation-band filtering |
| `status` | Active, Closed, Draft/Pending Review, Rejected-Non-MA | Lifecycle state; only `Active` shown publicly |

*Revision note: `job_function` gained Marketing & Growth, Data & Analytics, Customer
Success & Support, and "Operations & People" was renamed to "Operations, Finance &
People"; `primary_vertical`/`secondary_verticals` gained Cybersecurity; `technical_domain`
gained Classical ML/Predictive Analytics — added after reviewing the original lists
against Boston/MA candidate and talent-partner mental models. This is the current,
authoritative list; the sections below and all `ops/`/`frontend/` artifacts were
updated to match.*

### 6.1 LLM normalization rules (condensed, for the extraction prompt)

- Geographic validation: if the role is strictly outside MA and not MA-remote-eligible,
  set `is_ma_eligible: false` and reject.
- Founding-role detection: title contains "Founding"/"Employee #", or description
  states candidate will be among first ~10 employees.
- Transit corridor mapping is keyword-based on neighborhood/town names (see table
  above); default to `Remote/Distributed` if no physical office is implied.
- Facility type: wet-lab/assay/pipetting/vivarium keywords → Wet Lab/Vivarium; CNC/
  solder/cleanroom/test-bench keywords → Hardware Lab/Machine Shop; else Standard
  Office.
- Funding stage / primary vertical / transit corridor / sponsoring VC are **only**
  LLM-inferred when the company has no `Portfolio_Companies` master record match —
  otherwise they're inherited and locked (§4 step 4, §5).
- Output must be raw JSON only (no markdown fences, no commentary).

## 7. Frontend / interactive prototype — placeholder, needs active design

The source chat gives one ASCII wireframe (search bar + facet checkboxes + result
cards with badges for founding-role / verified-stage / transit / facility) and a short
list of UX bullets, but no real interaction design, page inventory, or component spec.
Given the stated purpose of this project — hand stakeholders something *interactive*
to react to and help refine fields/filters — this is the part that most needs fresh
work, not retrieval from the source chat.

Known inputs to the frontend design (do carry these forward):
- **Entry points:** faceted job search (primary) + a `/companies` directory (secondary,
  filterable by stage/sector/location, drilling into per-company role lists).
- **Persona-driven view toggle** (from the chat's user-journey ideation, worth
  preserving as a filter/preset rather than separate pages): All Roles, Founding
  Engineers, Wet Lab/TechBio, Generalist Operators.
- **Card-level badges:** ⚡ Founding Role, ★ Stage Verified (vs. inferred), "Backed by
  [VC names]" (plural for syndicates), transit-corridor chip, facility-type chip.
- **Apply flow:** always an outbound deep-link to the original ATS URL with
  `?source=nevca_talent` appended — no embedded/native application flow in this POC.
- Filters = the full canonical field list in §6; which ones are primary (always
  visible) vs. secondary (behind "more filters") is **not yet decided** and should be
  shaped by stakeholder feedback, which is the whole point of building this prototype.

**Decision: standalone mock frontend, with designated integration points.** The
prototype runs on sample/mock data — it is not wired to a live Airtable base or
Make.com pipeline — but every place a real data source will eventually plug in must be
a clearly marked seam in the code/design, not just inline mock values. At minimum,
designate seams for:
- the job listing data source (today: a static mock dataset shaped like the
  `Job_Postings` canonical schema in §6; later: the live Airtable base/API in §5),
- company logos (today: placeholder art/initials; later: `Company_Logo` attachment
  from `Portfolio_Companies`),
- the submission/"Post a role" entry point (today: can be a disabled button or a form
  that doesn't actually submit anywhere; later: the Fillout/Make.com webhook in §4),
- the "Apply on Company Site" outbound link (today: can point at placeholder/sample
  URLs; later: the real `Apply_URL` formula output).

Specifics of these seams (exact placeholder treatment for logos, information density/
layout orientation, etc.) are deferred to detailed UI design work, not this spec — this
section only commits to *where* the plug-in boundaries are, not their final look.

## 8. Superseded — do not implement

Per the source chat's own closing alignment/verification pass (later decisions
explicitly override these; carried forward here so no agent resurrects them):

| Topic | Do not do | Do instead |
|---|---|---|
| Sourcing | Unbounded scraping of all 88 firms' portfolios | Gated submission portal + one bounded 15-company cold-start seed (§4) |
| Auth | Corporate email domain checks or ATS OAuth/admin grants | VC-firm-level access codes (§3) |
| Normalization | Pure regex/LLM inference from JD text alone | LLM infers only when no `Portfolio_Companies` master match; otherwise inherit locked fields (§4, §5) |
| Syndicates | Attribute a job to whichever firm happened to submit it | Multi-link `Sponsoring_VCs`, credit the full syndicate (§3, §5) |
| Geography | Generic municipality/county radius | Transit-corridor model (§6) |
| Personas | Generic job titles / flat department buckets | Founding-role, equity-tier, technical-domain fields (§6) |
| Lifecycle | Manual deletion or full re-crawl diffing | Daily automated HTTP HEAD liveness check + 45-day TTL (§9) |

## 9. Data hygiene & lifecycle

- Daily scheduled job (Make.com, ~02:00 America/New_York): query all `Active`
  postings, `HEAD` request each `Job_URL` (no redirect-follow — a 301/302 usually
  means the ATS killed the posting).
  - 200 → update `Last_Liveness_Check`, `Liveness_HTTP_Code = 200`, stays Active.
  - Anything else → `Status = Closed`, record the status code.
- Independent of liveness: 45-day TTL from `Submission_Date` auto-archives a posting
  if not refreshed/re-submitted.

## 10. Success metrics (for the leadership demo)

- Geographic normalization accuracy > 95% (correct MA on-site/hybrid vs. remote
  classification).
- Ingestion latency < 2 minutes, submission → visible in search index.
- 0% broken links in the directory during the pilot (liveness check working).

## 11. Timeline (reference only, not binding)

~3 weeks: (1) Airtable schema + 88 VC codes + seed 15 companies, (2) Make.com
ingestion engine + liveness checker, (3) frontend + stakeholder demo. Not a
commitment — included so agents understand this is POC-paced work, not a
production rollout.

## 12. Setup checklist — accounts, keys, and decisions needed from the human

Nothing below blocks the frontend mock prototype (§7); it's listed here so the other
workstreams in §13 aren't silently stalled waiting on something only the human can
provide.

**Accounts / API keys**
- [ ] Airtable account + workspace, Personal Access Token (scopes: `data.records:read`,
      `data.records:write`, `schema.bases:write`) — needed to actually provision the
      base in §5 (schema can be drafted without it).
- [ ] Make.com account, Pro tier recommended (10k ops/mo, per §2 budget) — needed to
      actually build the scenarios in §4/§9 (runbook can be drafted without it).
- [ ] OpenAI API key with billing enabled, access to `gpt-4o-mini` — needed to live-test
      the normalization prompt in §6.1 (prompt/test harness can be drafted without it).
- [ ] Fillout or Softr account — needed before the real Track 2 submission form goes
      live; not needed for the mock prototype (§7's submission seam is a stub).
- [ ] Softr (or Webflow + Finsweet Filters) account — needed for the real public
      directory bound to live Airtable; not needed for the mock prototype.
- [ ] Optional: hosting/domain (e.g., Vercel/Netlify + DNS) if the mock prototype
      should be a shareable link rather than run locally.

**Decisions / information only the human can provide**
- [ ] Confirm host organization: NEVCA (current assumption throughout this spec) vs.
      MassTLC, or a different structure.
- [ ] NEVCA member VC firm roster (or an initial pilot subset) — needed to seed
      `VC_Registry` and issue access codes.
- [ ] Select the ~15 "flagship" MA portfolio companies for cold-start seeding (§4
      Track 1) — a strategic/political choice about who gets showcased first, not
      something an agent should decide unilaterally.
- [ ] Who owns/operates access-code issuance and VC relationships once codes exist —
      not blocking for the prototype, but blocking before Track 2 goes live.
- [ ] Branding assets (logo, color palette) for the mock prototype, if any exist yet —
      otherwise agents will use generic/neutral placeholders.
- [ ] Flag whether any data-sharing or legal review is needed before publicly listing
      a portfolio company's job (even via the one-time Track 1 scrape) — surfacing
      early so it doesn't block later.

## 13. Parallel workstreams (current state)

Given §12, only the frontend prototype is fully unblocked today. The others can get
most of the way to "ready to execute" as drafts/runbooks without credentials, then need
a human-provided account or decision to go live.

| # | Workstream | Blocked by §12? | Output |
|---|---|---|---|
| 1 | Frontend mock prototype (§7) | No | Working interactive UI over a hand-authored mock dataset shaped like §6 |
| 2 | Airtable schema drafting (§5) | Drafting: no. Provisioning: Airtable PAT | Ready-to-run base/table/field/formula spec (or a provisioning script) |
| 3 | Make.com ops runbook (§4, §9) | Drafting: no. Executing: Make.com + Airtable + OpenAI accounts | Step-by-step scenario build guide matching the finalized schema |
| 4 | LLM normalization prompt + test harness (§6.1) | Drafting/offline testing: no. Live validation: OpenAI key | Finalized prompt + sample-input test suite |
| 5 | Seed data research (§4 Track 1) | Partially: public ATS token lookup is open research; final company/VC list needs human selection | Candidate list of 15 companies with ATS platform + board token, draft `VC_Registry` seed structure |
