# Airtable Schema — MA Talent Exchange

Ready-to-provision schema for `SPEC.md` §5 (table structure) and §6 (canonical
taxonomy / option lists). Three linked tables: `VC_Registry`, `Portfolio_Companies`,
`Job_Postings`. Option lists below are copied verbatim from SPEC.md §6 — do not
substitute values from SPEC.md §8 ("Superseded").

Judgment calls made where SPEC.md was silent, flagged inline with **[JUDGMENT CALL]**.

---

## Table 1: `VC_Registry`

| Field | Type | Options / Formula |
|---|---|---|
| `Firm_Name` | Single line text | **Primary field.** |
| `Access_Code` | Single line text | Unique token per firm (e.g. `PLR-NEVCA-26`). Airtable does not enforce uniqueness natively — **[JUDGMENT CALL]** enforce at issuance time (generation script) or via a Make.com validation step, not a native constraint. |
| `Talent_Partner_Name` | Single line text | |
| `Talent_Partner_Email` | Email | |
| `Code_Status` | Single select | `Active`, `Revoked`, `Rate-Limited` |
| `Portfolio_Companies` | Link to another record → `Portfolio_Companies` | Allow linking to multiple records |
| `Submitted_Job_Postings` | Link to another record → `Job_Postings` | Allow linking to multiple records. **[JUDGMENT CALL]** SPEC.md just says "link → Job_Postings"; named to mirror `Job_Postings.Submitted_By_VC` which this is the reverse of. |
| `Active_Flag_Sum` → `Active_Jobs_Count` | Rollup | See **Active_Jobs_Count implementation note** below — cannot be a plain `COUNTA` filtered by Status; requires a helper field on `Job_Postings`. |

### `Active_Jobs_Count` implementation note **[JUDGMENT CALL]**

Airtable rollups aggregate the *entire* linked array — there is no native
"rollup only where Status = Active" filter expression. To get a true active-count:

1. On `Job_Postings`, add helper field `Active_Flag` (Formula): `IF({Status} = 'Active', 1, 0)`
2. On `VC_Registry`, add `Active_Jobs_Count` (Rollup): source field = `Submitted_Job_Postings` → `Active_Flag`, aggregation function = `SUM`.

---

## Table 2: `Portfolio_Companies`

| Field | Type | Options / Formula |
|---|---|---|
| `Company_Name` | Single line text | **Primary field.** |
| `Company_Domain` | Single line text | Root domain, e.g. `kendallmotion.com` |
| `ATS_Slug` | Single line text | e.g. `kendall-motion` |
| `Sponsoring_VCs` | Link to another record → `VC_Registry` | Allow linking to multiple records (syndicates) |
| `Funding_Stage` | Single select | `Pre-Seed/Seed`, `Series A`, `Series B`, `Series C+/Growth`, `Bootstrapped/Profitable` |
| `Primary_Vertical` | Single select | `Biotech & Life Sciences`, `Robotics & Hardware`, `AI & DeepTech`, `ClimateTech & Clean Energy`, `Enterprise SaaS`, `FinTech & InsurTech`, `HealthTech & Digital Health`, `Cybersecurity` |
| `Secondary_Verticals` | Multiple select | Same 8 options as `Primary_Vertical` |
| `Headquarters_City` | Single line text | e.g. `Cambridge`, `Waltham` |
| `Transit_Corridor` | Single select | `Kendall/Cambridge (Red Line)`, `Seaport/Innovation District`, `Downtown/Back Bay (Orange/Green)`, `Route 128/MetroWest (Car/Rail)`, `Route 495/Outer Suburbs`, `Remote/Distributed` |
| `Facility_Type` | Single select | `Standard Office`, `Wet Lab/Vivarium`, `Hardware Lab/Machine Shop`, `Distributed/Remote` |
| `Company_Logo` | Attachment | |
| `Record_Verification` | Single select | `Verified`, `Unverified-Auto-Generated`, `Under Review` |
| `Active_Jobs` | Link to another record → `Job_Postings` | Reverse of `Job_Postings.Company_Ref` |

### `Portfolio_Review_Queue` note **[JUDGMENT CALL]**

SPEC.md §4 step 4 references routing unmatched companies to a `Portfolio_Review_Queue`.
SPEC.md §5 does not define this as a separate table, and the source chat described it
as *"a view in Airtable"*, not a table. Implemented here as an Airtable **view** on
`Portfolio_Companies` filtered to `Record_Verification = 'Under Review'` — not a
4th table. The Airtable Metadata API has limited/no support for creating views
programmatically; create this view manually in the Airtable UI after provisioning.

---

## Table 3: `Job_Postings`

| Field | Type | Options / Formula |
|---|---|---|
| `Job_ID` | Formula | **Primary field.** `CONCATENATE({Company_Name_Lookup}, " - ", {Job_Title}, " (", RECORD_ID(), ")")`. **[JUDGMENT CALL]**: the source chat's original formula used a `{City}` field on `Job_Postings` that SPEC.md dropped (city now lives on `Portfolio_Companies.Headquarters_City`). Substituted `RECORD_ID()` as the uniqueness guarantor instead of city, since two roles at the same company with the same title would otherwise collide. |
| `Job_Title` | Single line text | |
| `Job_URL` | URL | |
| `Apply_URL` | Formula | `CONCATENATE({Job_URL}, IF(FIND("?", {Job_URL}) > 0, "&", "?"), "source=nevca_talent")` |
| `Company_Ref` | Link to another record → `Portfolio_Companies` | Single record link |
| `Company_Name_Lookup` | Lookup | from `Company_Ref` → `Company_Name`. **[JUDGMENT CALL]** added — not listed explicitly in SPEC.md §5's lookup list but required by the `Job_ID` formula and by the card UI ("Company name"). |
| `Company_Logo_Lookup` | Lookup | from `Company_Ref` → `Company_Logo` |
| `Funding_Stage_Lookup` | Lookup | from `Company_Ref` → `Funding_Stage` |
| `Primary_Vertical_Lookup` | Lookup | from `Company_Ref` → `Primary_Vertical` |
| `Secondary_Verticals_Lookup` | Lookup | from `Company_Ref` → `Secondary_Verticals` |
| `Transit_Corridor_Lookup` | Lookup | from `Company_Ref` → `Transit_Corridor` |
| `Sponsoring_VCs_Lookup` | Lookup | from `Company_Ref` → `Sponsoring_VCs` |
| `Submitted_By_VC` | Link to another record → `VC_Registry` | |
| `Workplace_Type` | Single select | `Strictly On-site`, `Hybrid (1-2 days/wk)`, `Hybrid (3-4 days/wk)`, `Remote (MA-Only)` |
| `Facility_Type` | Single select | `Standard Office`, `Wet Lab/Vivarium`, `Hardware Lab/Machine Shop`, `Distributed/Remote` (per-role override of company default) |
| `Job_Function` | Single select | `Founding & Executive`, `Machine Learning & AI`, `Software & Infrastructure`, `Robotics & Hardware`, `Biotech & Life Sciences`, `Product & Design`, `GTM & Sales`, `Marketing & Growth`, `Data & Analytics`, `Customer Success & Support`, `Operations, Finance & People` |
| `Seniority` | Single select | `Entry-Level/Associate`, `Mid-Level`, `Senior`, `Lead/Principal`, `Executive (VP+)`. **[JUDGMENT CALL]** this field is in SPEC.md §6's canonical taxonomy but was omitted from §5's prose field list — added here since the frontend filter design depends on it existing on the record. |
| `Is_Founding_Role` | Checkbox | |
| `Technical_Domain` | Multiple select | `Molecular Modeling/TechBio`, `Physical AI/Robotics`, `LLM & Multi-Agent Systems`, `Computer Vision`, `Distributed Systems`, `Classical ML/Predictive Analytics` |
| `Equity_Tier` | Single select | `High (>1.0%)`, `Standard (0.25-1.0%)`, `Disclosed on Request`, `N/A` |
| `Salary_Min` | Currency (USD, 0 decimals) | |
| `Salary_Max` | Currency (USD, 0 decimals) | |
| `Status` | Single select | `Active`, `Closed`, `Draft/Pending Review`, `Rejected-Non-MA` |
| `Active_Flag` | Formula | `IF({Status} = 'Active', 1, 0)` — helper for `VC_Registry.Active_Jobs_Count`, see above |
| `Stage_Verification` | Formula | `IF({Funding_Stage_Lookup} != '', 'Verified via Portfolio Master', 'Inferred from JD (Unverified)')` |
| `Submission_Date` | Created time | |
| `Expires_At` | Formula | `DATEADD({Submission_Date}, 45, 'days')` |
| `Last_Liveness_Check` | Date (include time) | Updated by the daily liveness-check automation, not on create |
| `Liveness_HTTP_Code` | Number (integer) | |

---

## Provisioning order (matters for link/lookup dependencies)

1. Create all three tables with their non-relational fields only (text, select,
   number, date, attachment, checkbox).
2. Add link fields (`VC_Registry.Portfolio_Companies`, `Portfolio_Companies.
   Sponsoring_VCs`, `Job_Postings.Company_Ref`, `Job_Postings.Submitted_By_VC`).
   Airtable auto-creates the symmetric reverse-link field on the other table —
   rename those to match the names above (`Active_Jobs`, `Submitted_Job_Postings`).
3. Add lookup fields on `Job_Postings` (depend on `Company_Ref` existing).
4. Add formula fields (`Job_ID`, `Apply_URL`, `Active_Flag`, `Stage_Verification`,
   `Expires_At`) — depend on the lookups existing.
5. Add the `Active_Jobs_Count` rollup on `VC_Registry` (depends on `Active_Flag`
   existing on `Job_Postings`).
6. Manually create the `Portfolio_Review_Queue` view on `Portfolio_Companies`
   (not scriptable via Metadata API — see note above).

See `airtable_provision.py` for an automated attempt at steps 1–5.
