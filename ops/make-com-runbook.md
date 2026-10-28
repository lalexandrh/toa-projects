# Make.com Runbook — NEVCA Massachusetts Talent Exchange

Config guide for the two Make.com scenarios that implement SPEC.md §4 (ingestion) and
§9 (liveness). This is not executable code — it's a step-by-step build guide for
whoever has Make.com/Airtable/OpenAI access. Items that need a real value the human
hasn't provided yet are marked **⚠ NEEDS HUMAN INPUT** (see SPEC.md §12).

Prerequisite for both scenarios: an Airtable base named `NEVCA Talent Exchange` with
the three tables from SPEC.md §5 (`VC_Registry`, `Portfolio_Companies`,
`Job_Postings`), connected to Make.com via an Airtable Personal Access Token with
scopes `data.records:read` and `data.records:write`. ⚠ NEEDS HUMAN INPUT: the
Airtable PAT and the actual base ID (only exists once the schema-provisioning
workstream has run — see `ops/` schema deliverable).

---

## Scenario 1 — Job Intake Pipeline

```
[Submission Form: POST JSON] → [1: Webhook] → [2: Airtable Search VC_Registry]
   → [3: Router: 401 if no match] → [4: Text Parser: extract domain/slug]
   → [5: Airtable Search Portfolio_Companies] → [6: HTTP GET job_url]
   → [7: OpenAI Chat Completion] → [8: JSON Parse] → [9: Airtable Upsert Job_Postings]
   → [10: Webhook Response]
```

### Step 1 — Create the webhook

1. New Make.com scenario, name it `NEVCA - Job Intake Pipeline`.
2. Add a **Webhooks → Custom Webhook** module, name the hook
   `NEVCA_Job_Submission_Hook`, save it.
3. Copy the generated webhook URL. ⚠ NEEDS HUMAN INPUT: this URL becomes the target
   the intake form (Fillout/Softr, per SPEC.md §12) must POST to — not knowable until
   the scenario is created in a real account.
4. Send one test payload to let Make learn the data structure:

```bash
curl -X POST "https://hook.us1.make.com/YOUR_WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "vc_code": "PLR-NEVCA-26",
    "job_url": "https://jobs.ashbyhq.com/kendall-motion/a1b2c3d4-e5f6-7890",
    "raw_text": "",
    "submitter_email": "talent@pillar.vc"
  }'
```

Expected incoming payload shape: `vc_code` (string, required), `job_url` (string,
required unless `raw_text` given), `raw_text` (string, optional fallback),
`submitter_email` (string, optional), `company_name` (string, optional).

### Module 2 — Airtable Search Records (validate access code)

- Table: `VC_Registry`
- Formula: `AND({Access_Code} = '{{1.vc_code}}', {Code_Status} = 'Active')`
- Max Records: 1

### Module 3 — Router (reject invalid codes)

- **Branch A (no match)** — filter: *total bundles from Module 2 = 0* → **Webhook
  Response** module, status `401`, body:
  ```json
  {"success": false, "error": "Invalid or inactive NEVCA Member Access Code."}
  ```
  Header `Content-Type: application/json`. Terminates the scenario for this branch.
- **Branch B (authenticated)** — filter: *total bundles from Module 2 > 0* → continue
  to Module 4.

### Module 4 — Text Parser (extract domain/ATS slug)

- Match Pattern module on `{{1.job_url}}`:
  ```
  (?:https?:\/\/)?(?:www\.)?(?:jobs\.)?([a-zA-Z0-9-]+)(?:\.com|\.io|\.ai|\.org|\.ashbyhq\.com|\/boards\.greenhouse\.io|\.lever\.co)
  ```
- Output `$1` is the candidate domain/slug (e.g. `kendall-motion`).

### Module 5 — Airtable Search Records (Portfolio_Companies master lookup)

- Table: `Portfolio_Companies`
- Formula:
  ```
  OR(
    {ATS_Slug} = '{{4.$1}}',
    FIND(LOWER('{{4.$1}}'), LOWER({Company_Domain})) > 0
  )
  ```
- Max Records: 1
- **Match found** → Module 9 links `Company_Ref` to this record; Airtable Lookups
  inherit `Funding_Stage`, `Primary_Vertical`, `Secondary_Verticals`,
  `Transit_Corridor`, `Sponsoring_VCs` automatically (SPEC.md §4 step 4, §5) — no
  Make-side mapping needed for those fields.
- **No match** → leave `Company_Ref` empty; the LLM step (Module 7) infers
  company-level fields instead, and a human should later add an Airtable automation
  or manual step to create a `Portfolio_Review_Queue` entry flagging this company for
  verification (SPEC.md §4 step 4). That queue view/automation isn't detailed in the
  source material beyond "create an entry" — treat as a small follow-up build item
  once the base exists, not blocking for the intake pipeline itself.

### Module 6 — HTTP Make a Request (fetch job listing content)

- URL: `{{1.job_url}}`
- Method: `GET`
- Headers: `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
- Follow redirect: **Yes**
- Parse response: **No** (raw string payload — Module 7 does the parsing)
- **Error handler (403 anti-bot wall):** attach a Resume-type error handler on this
  module. On 403, extract `og:title`/`og:description` via a secondary regex instead
  of the full page body, and route the eventual record to
  `Status = "Draft / Pending Review"` rather than dropping the submission
  (SPEC.md §4 step 5).

### Module 7 — OpenAI Create a Chat Completion (normalization)

- Connection: OpenAI API key. ⚠ NEEDS HUMAN INPUT (SPEC.md §12).
- Model: `gpt-4o-mini`, Temperature: `0.0`, Response Format: `json_object`.
- **System message** (condensed rules — full canonical values are SPEC.md §6):
  ```
  You are the data transformation engine for the New England Venture Capital
  Association (NEVCA). Extract job details from raw HTML/text into a JSON object
  adhering to the specified schema.

  Rules:
  1. GEOGRAPHIC VALIDATION: Verify if the job is located in Massachusetts or allows
     MA residents. If strictly outside MA, set "is_ma_eligible": false.
  2. FOUNDING ROLES: Set "is_founding_role": true if the title contains "Founding",
     "Employee #", or mentions being one of the first 10 employees.
  3. TECHNICAL DOMAIN: Choose zero or more: ["Molecular Modeling / TechBio",
     "Physical AI / Robotics", "LLM & Multi-Agent Systems", "Computer Vision",
     "Distributed Systems"].
  4. TRANSIT CORRIDOR: Set to one of: "Kendall / Cambridge (Red Line)",
     "Seaport / Innovation District", "Downtown / Back Bay (Orange/Green)",
     "Route 128 / MetroWest (Car/Rail)", "Route 495 / Outer Suburbs",
     "Remote / Distributed".
  5. FACILITY TYPE: wet lab/assay/vivarium keywords -> "Wet Lab / Vivarium"; CNC/
     solder/cleanroom/test-bench keywords -> "Hardware Lab / Machine Shop";
     otherwise "Standard Office".
  6. OUTPUT FORMAT: Raw JSON only, no markdown fences, no commentary.
  ```
  (This is the condensed version for the Make module; the full prompt including the
  JSON response schema is owned by the LLM-normalization workstream — see
  `ops/llm-normalization/`. Keep the two in sync.)
- **User message:**
  ```
  URL: {{1.job_url}}
  FALLBACK_TEXT: {{1.raw_text}}

  CONTENT:
  {{substring(6.data; 0; 12000)}}
  ```

### Module 8 — JSON Parse JSON

- JSON String: `{{7.choices[1].message.content}}`
- **Validation safeguard:** if parsing fails (OpenAI returned non-JSON), route to a
  manual-review path instead of continuing to Module 9 — never let a broken payload
  reach the live index (SPEC.md §4 step 6).

### Module 9 — Airtable Create/Update a Record (Job_Postings)

- Table: `Job_Postings`
- Field mapping:
  - `Job_Title`: `{{8.job_title}}`
  - `Job_URL`: `{{1.job_url}}`
  - `Submitted_By_VC`: `[{{2.records[1].id}}]` (record ID from Module 2)
  - `Company_Ref`: `ifempty(5.records[1].id; empty)` (Module 5 match, blank if none)
  - `Workplace_Type`: `{{8.workplace_type}}`
  - `Facility_Type`: `{{8.facility_type}}`
  - `Job_Function`: `{{8.job_function}}`
  - `Is_Founding_Role`: `{{8.is_founding_role}}`
  - `Technical_Domain`: `{{8.technical_domain}}`
  - `Equity_Tier`: `{{8.equity_tier}}`
  - `Salary_Min` / `Salary_Max`: `{{8.salary_min}}` / `{{8.salary_max}}`
  - `Status`: `if(8.is_ma_eligible = false; "Rejected - Non-MA"; "Active")` — if the
    403/anti-bot fallback in Module 6 fired, override to `"Draft / Pending Review"`
    instead.
  - `Apply_URL`, `Expires_At`: recommend implementing these as **Airtable formula
    fields** (per SPEC.md §5: `Apply_URL` appends `?source=nevca_talent`;
    `Expires_At` = `Submission_Date + 45 days`) so Make doesn't need to compute them.
    If the schema instead uses plain fields, Make must set them explicitly here.
    ⚠ Confirm actual field type with whoever provisions the base
    (`ops/` Airtable-schema workstream) — flagging so the two workstreams don't
    diverge.
  - `Submission_Date`: leave unset if it's an Airtable "Created time" field (auto);
    only map it if it's a plain date field.

### Module 10 — Webhook Response (confirmation)

- Status: `200`
- Body:
  ```json
  {
    "success": true,
    "record_id": "{{9.id}}",
    "company_matched": "{{if(length(5.records) > 0, true, false)}}",
    "status": "{{9.Status}}"
  }
  ```
- Header: `Content-Type: application/json`

### Guardrails for this scenario

- Airtable allows 5 req/sec/base. During the Track 1 bulk cold-start seed (SPEC.md
  §4), set Make's execution to serial (max bundle size 1) to avoid 429s — this
  applies to whatever process loads the initial 60–100 seed jobs, not just this
  webhook scenario.
- Never let an OpenAI JSON-parse failure (Module 8) or a 403 anti-bot block (Module 6)
  silently drop a submission — both have an explicit fallback path above, not a dead
  end.

---

## Scenario 2 — Daily Liveness Checker

```
[1: Schedule 02:00 America/New_York] → [2: Airtable Search Active postings]
  → [3: HTTP HEAD job_url, no redirect] → [4: Router on status code]
  → [4A: 200 → update check timestamp] / [4B: else → Status = Closed]
```

### Step 1 — Scenario setup

- New scenario: `NEVCA - Job Liveness Monitor`.
- Trigger: **Schedule**, daily at `02:00 AM America/New_York`.

### Step 2 — Airtable Search Records

- Table: `Job_Postings`
- Filter Formula:
  ```
  AND(
    {Status} = 'Active',
    OR(
      {Last_Liveness_Check} = BLANK(),
      IS_BEFORE({Last_Liveness_Check}, DATEADD(TODAY(), -1, 'days'))
    )
  )
  ```

### Step 3 — HTTP HEAD request

- Method: `HEAD`
- URL: `{{2.Job_URL}}`
- Follow redirect: **No** — Greenhouse/Ashby/Lever redirect dead postings to a
  generic board page; a 301/302 here means the role closed, same as a 404.

### Step 4 — Router

- **Path 1 (live, status = 200):** Airtable Update → `Last_Liveness_Check = now()`,
  `Liveness_HTTP_Code = 200`. Status stays `Active`.
- **Path 2 (anything else):** Airtable Update → `Status = "Closed"`,
  `Liveness_HTTP_Code = {{3.statusCode}}`.

### Independent of this scenario

The 45-day TTL (SPEC.md §9) is not part of this liveness check — it should be a
separate Airtable formula/automation comparing `Submission_Date + 45 days` against
today and auto-archiving if exceeded, regardless of liveness-check results. Treat as
a small additional Airtable automation, not a Make.com scenario.

---

## Open items for the schema-provisioning workstream

- Confirm `Apply_URL` and `Expires_At` are implemented as Airtable formula fields
  (recommended) vs. plain fields Make must populate — see Module 9 note above.
- Confirm exact `Status` single-select option labels match what's used here
  (`Active`, `Closed`, `Draft / Pending Review`, `Rejected - Non-MA`) so Make's
  string literals don't silently fail to match.
- `Portfolio_Review_Queue` (a view or table for unmatched companies, SPEC.md §4
  step 4) isn't fully specified in either the spec or the source transcript beyond
  "create an entry" — needs a concrete definition (likely a filtered Airtable view
  on `Portfolio_Companies` where `Record_Verification = "Under Review"`, populated by
  a lightweight additional Make module) before Scenario 1 can be considered complete.

---

## Verification against SPEC.md

Checked the source transcript's detailed Make.com module walkthrough against
SPEC.md's finalized architecture (§4, §5, §9, §12) — no conflicts found. The source
material's HTTP/Airtable/OpenAI module configuration is consistent with and more
granular than SPEC.md's narrative description; this runbook merges the two without
needing to resolve any contradiction. Two things worth flagging (not contradictions,
just gaps carried over from the source as-is): (1) the `Portfolio_Review_Queue` logic
is asserted but never mechanically specified anywhere in the source chat either; (2)
the source transcript doesn't say whether `Apply_URL`/`Expires_At` are Make-populated
or Airtable-formula fields — both are called out above as open items rather than
resolved unilaterally, since that's a schema-ownership decision.
