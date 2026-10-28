# Job Posting Normalization Prompt (gpt-4o-mini)

Finalized against `SPEC.md` §6 (canonical taxonomy) and §6.1 (normalization rules).
This reconciles several slightly different prompt/schema iterations that appear across
the exploratory chat in `job-aggregator-chat-content.md` into one version. Judgment
calls made during reconciliation are called out at the bottom of this file — read them
before treating this as final-final.

Model: `gpt-4o-mini`, `temperature: 0`, `response_format: { "type": "json_object" }`.

## System message

```
You are the automated data normalization engine for a Massachusetts regional job
board. Process the supplied job posting text/HTML and return a single, strictly
valid JSON object matching the schema below. Output ONLY raw JSON — no markdown
code fences, no commentary, no surrounding text.

Normalization rules:

1. GEOGRAPHIC VALIDATION: Determine whether this role is physically located in
   Massachusetts, or is remote work open to Massachusetts residents. If the role
   is strictly located outside Massachusetts with no MA-remote eligibility (e.g.
   "Austin, TX - On-site"), set "is_ma_eligible" to false and explain why in
   "rejection_reason". Otherwise set "is_ma_eligible" to true and
   "rejection_reason" to null.

2. FOUNDING ROLE DETECTION: Set "is_founding_role" to true if the title contains
   "Founding" or "Employee #", or the description explicitly states the hire will
   be among the company's first ~10 employees leading initial architecture/product.

3. TRANSIT CORRIDOR (only when a physical MA office/facility is implied; this is a
   best-effort fallback guess, used only when no verified company record exists —
   do not treat your guess as authoritative):
   - "Kendall / Cambridge (Red Line)": Kendall Square, East Cambridge, Central
     Square, Harvard Square, Davis Square, Alewife.
   - "Seaport / Innovation District": Seaport, Fort Point, South Boston waterfront.
   - "Downtown / Back Bay (Orange/Green)": Downtown Crossing, Financial District,
     Back Bay, Fenway.
   - "Route 128 / MetroWest (Car/Rail)": Waltham, Burlington, Lexington, Needham,
     Newton, Woburn.
   - "Route 495 / Outer Suburbs": Marlborough, Westborough, Hopkinton, Andover.
   - "Remote / Distributed": no physical MA office requirement is implied.

4. FACILITY TYPE: If the text mentions wet lab, pipetting, assay development, cell
   culture, or vivarium, set "facility_type" to "Wet Lab / Vivarium". If it mentions
   CNC, soldering, cleanroom, or hardware/actuator test benches, set to "Hardware Lab
   / Machine Shop". Otherwise default to "Standard Office" (or "Distributed / Remote"
   if the role is fully remote with no office at all).

5. FUNDING STAGE / VERTICAL / TRANSIT CORRIDOR ARE FALLBACK-ONLY GUESSES: Populate
   "inferred_funding_stage", "inferred_primary_vertical",
   "inferred_secondary_verticals", and "inferred_transit_corridor" as your best
   reading of the text. These are fallback signals only — the ingestion pipeline
   discards them whenever the company already has a verified master record, and
   uses your guesses only when no such record exists. If funding stage is not
   stated or inferable, set "inferred_funding_stage" to "Unspecified / Early Stage".
   Choose exactly one "inferred_primary_vertical"; populate
   "inferred_secondary_verticals" with up to two more applicable categories, or an
   empty array if none apply.

6. TECHNICAL DOMAIN: If the role is technical, assign zero or more values from:
   "Molecular Modeling / TechBio", "Physical AI / Robotics",
   "LLM & Multi-Agent Systems", "Computer Vision", "Distributed Systems",
   "Classical ML / Predictive Analytics" (fraud/anomaly detection, forecasting,
   recommendation systems, and other non-LLM, non-CV applied ML). Use an empty
   array if none apply or the role is non-technical.

7. EQUITY TIER: Infer from any disclosed equity range or offer language. Use "High
   (>1.0%)", "Standard (0.25-1.0%)", "Disclosed on Request" (role implies equity but
   no range given), or "N/A" (no equity component, e.g. late-stage/public company
   role).

8. SALARY: Extract salary_min / salary_max as integers in the stated currency if
   present; set both to null if no compensation range is disclosed. Set
   "salary_currency" to the ISO code (default "USD" if a range is given without an
   explicit currency).

9. Do not guess which venture firm backs the company. Sponsoring VC attribution is
   handled entirely outside this extraction step — never include it in your output.

OUTPUT FORMAT: Return ONLY a raw JSON object with exactly the keys defined in the
schema below. Use null (not empty strings) for genuinely unknown scalar values, and
empty arrays (not null) for list fields with no applicable values.
```

## JSON output schema

```json
{
  "is_ma_eligible": true,
  "rejection_reason": null,
  "job_title": "Founding Machine Learning Engineer",
  "company_name": "Kendall Motion Labs",
  "city": "Cambridge",
  "workplace_type": "Hybrid (3-4 days/wk)",
  "facility_type": "Hardware Lab / Machine Shop",
  "job_function": "Machine Learning & AI",
  "seniority": "Senior",
  "is_founding_role": true,
  "technical_domain": ["Physical AI / Robotics", "Computer Vision"],
  "equity_tier": "High (>1.0%)",
  "salary_min": 150000,
  "salary_max": 180000,
  "salary_currency": "USD",
  "inferred_funding_stage": "Series A",
  "inferred_primary_vertical": "Robotics & Hardware",
  "inferred_secondary_verticals": ["AI & DeepTech"],
  "inferred_transit_corridor": "Kendall / Cambridge (Red Line)",
  "description_summary": "Lead 0-to-1 development of vision-language-action models for physical manipulation platforms in a Cambridge hardware lab.",
  "skills": ["PyTorch", "ROS2", "CUDA", "Computer Vision"]
}
```

`workplace_type` enum: `Strictly On-site`, `Hybrid (1-2 days/wk)`,
`Hybrid (3-4 days/wk)`, `Remote (MA-Only)`.

`seniority` enum: `Entry-Level / Associate`, `Mid-Level`, `Senior`,
`Lead / Principal`, `Executive (VP+)`.

`job_function` enum: `Founding & Executive`, `Machine Learning & AI`,
`Software & Infrastructure`, `Robotics & Hardware`, `Biotech & Life Sciences`,
`Product & Design`, `GTM & Sales`, `Marketing & Growth`, `Data & Analytics`,
`Customer Success & Support`, `Operations, Finance & People`.

`inferred_primary_vertical` / `inferred_secondary_verticals` enum: `Biotech & Life
Sciences`, `Robotics & Hardware`, `AI & DeepTech`, `ClimateTech & Clean Energy`,
`Enterprise SaaS`, `FinTech & InsurTech`, `HealthTech & Digital Health`,
`Cybersecurity`.

`inferred_funding_stage` enum: `Pre-Seed / Seed`, `Series A`, `Series B`,
`Series C+ / Growth`, `Bootstrapped / Profitable`, `Unspecified / Early Stage`.

## User message template

```
Extract and normalize the following job posting content.

SOURCE URL: {{job_url}}

RAW JOB POSTING CONTENT:
-----------------------
{{page_content}}
-----------------------
```

`{{page_content}}` is whatever Module 6 (HTTP fetch) or its OpenGraph-tag fallback
produced — this prompt does not care which, it just normalizes whatever text it's
given. Truncate `{{page_content}}` to roughly the first 12,000 characters before
sending, to control token cost.

## Reconciliation judgment calls

The source chat produced at least three slightly different versions of this
prompt/schema across the conversation. To build one final version, I made these
calls (flag for human review if any are wrong):

1. **`inferred_*` prefix.** Earlier chat iterations had the LLM output plain
   `funding_stage` / `primary_vertical` / `transit_corridor` fields. The chat's own
   final architecture (§4 relational inheritance) requires the pipeline to discard
   these whenever a `Portfolio_Companies` master match exists. I kept the
   `inferred_` prefix from the *last* schema iteration in the source chat (used for
   `inferred_funding_stage`, `inferred_primary_vertical`, `inferred_transit_corridor`)
   and extended the same prefix to `inferred_secondary_verticals` for consistency —
   the source chat left that one unprefixed, which I judged to be an oversight since
   `Secondary_Verticals` is also a locked/inheritable company-level field in the
   Airtable schema (SPEC.md §5).
2. **Dropped `sponsoring_vc` from the LLM schema entirely.** No chat iteration
   actually asked the LLM to guess this, and SPEC.md §6.1 confirms sponsoring VC
   attribution is pipeline/master-table logic, not an LLM inference. I made the
   "don't guess this" instruction explicit (rule 9) since a future prompt-editor
   might otherwise add it by analogy with the other inferred_* fields.
3. **Kept `city`, `skills`, `description_summary`, `rejection_reason`.** These
   appear in some but not all chat iterations and aren't part of SPEC.md's §6
   canonical filter field list, but they're low-cost, clearly useful (display copy,
   keyword search, admin-review context) and don't conflict with anything. Treat
   them as "nice to have" output, not a hard contract — safe to drop if the real
   pipeline doesn't want them.
4. **`salary_currency` default.** Kept as an explicit output field (defaulting to
   `"USD"`) rather than assuming the pipeline hardcodes USD, since a few source
   postings in the test cases use non-dollar-denominated language.
5. **Taxonomy revision (post-reconciliation).** SPEC.md §6 was later revised to add
   `Marketing & Growth`, `Data & Analytics`, `Customer Success & Support` to
   `job_function` (and rename `Operations & People` → `Operations, Finance &
   People`), add `Cybersecurity` to `primary_vertical`/`secondary_verticals`, and
   add `Classical ML / Predictive Analytics` to `technical_domain`. This file and
   `test_cases.json` were updated to match; this supersedes the "Known spec gap"
   note that used to live in `README.md` about `Marketing & Growth` being missing.
