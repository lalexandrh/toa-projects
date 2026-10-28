"""Provision the MA Talent Exchange Airtable base schema.

Creates the three tables described in airtable-schema.md (VC_Registry,
Portfolio_Companies, Job_Postings) along with their fields, links, lookups,
formulas, and the Active_Jobs_Count rollup, via the Airtable Metadata API
(requires the `schema.bases:write` scope on the Personal Access Token).

STATUS: NOT YET RUN AGAINST A LIVE AIRTABLE BASE. This is a best-effort
provisioning script written against the documented Airtable Web API /
pyairtable's metadata helpers. Airtable's field-creation API is strict about
per-type `options` payloads (especially for `multipleRecordLinks`, `multipleLookupValues`,
`rollup`, and `formula` fields, which depend on IDs of fields/tables created in
earlier calls) and pyairtable's high-level wrapper surface for schema
management has changed across versions. Test against a scratch base before
pointing this at anything real, and be ready to adjust field-option payloads
to match whatever pyairtable version is installed.

Usage:
    export AIRTABLE_PAT="pat_xxx"       # needs schema.bases:write, data.records:write
    export AIRTABLE_BASE_ID="appXXXXXXXXXXXXXX"
    python ops/airtable_provision.py

The base itself (AIRTABLE_BASE_ID) must already exist — this script does not
create a base, only tables/fields within one, since base creation requires an
Enterprise-only endpoint for most Airtable plans.
"""

import os
import sys

from pyairtable import Api

VERTICALS = [
    "Biotech & Life Sciences",
    "Robotics & Hardware",
    "AI & DeepTech",
    "ClimateTech & Clean Energy",
    "Enterprise SaaS",
    "FinTech & InsurTech",
    "HealthTech & Digital Health",
    "Cybersecurity",
]

TRANSIT_CORRIDORS = [
    "Kendall/Cambridge (Red Line)",
    "Seaport/Innovation District",
    "Downtown/Back Bay (Orange/Green)",
    "Route 128/MetroWest (Car/Rail)",
    "Route 495/Outer Suburbs",
    "Remote/Distributed",
]

FACILITY_TYPES = [
    "Standard Office",
    "Wet Lab/Vivarium",
    "Hardware Lab/Machine Shop",
    "Distributed/Remote",
]


def select_options(choices):
    return {"choices": [{"name": c} for c in choices]}


def main():
    pat = os.environ.get("AIRTABLE_PAT")
    base_id = os.environ.get("AIRTABLE_BASE_ID")
    if not pat or not base_id:
        print("Set AIRTABLE_PAT and AIRTABLE_BASE_ID environment variables.", file=sys.stderr)
        sys.exit(1)

    api = Api(pat)
    base = api.base(base_id)

    # --- Step 1: base (non-relational) fields -----------------------------
    vc_registry = base.create_table(
        "VC_Registry",
        fields=[
            {"name": "Firm_Name", "type": "singleLineText"},
            {"name": "Access_Code", "type": "singleLineText"},
            {"name": "Talent_Partner_Name", "type": "singleLineText"},
            {"name": "Talent_Partner_Email", "type": "email"},
            {
                "name": "Code_Status",
                "type": "singleSelect",
                "options": select_options(["Active", "Revoked", "Rate-Limited"]),
            },
        ],
    )

    portfolio_companies = base.create_table(
        "Portfolio_Companies",
        fields=[
            {"name": "Company_Name", "type": "singleLineText"},
            {"name": "Company_Domain", "type": "singleLineText"},
            {"name": "ATS_Slug", "type": "singleLineText"},
            {
                "name": "Funding_Stage",
                "type": "singleSelect",
                "options": select_options(
                    [
                        "Pre-Seed/Seed",
                        "Series A",
                        "Series B",
                        "Series C+/Growth",
                        "Bootstrapped/Profitable",
                    ]
                ),
            },
            {"name": "Primary_Vertical", "type": "singleSelect", "options": select_options(VERTICALS)},
            {"name": "Secondary_Verticals", "type": "multipleSelects", "options": select_options(VERTICALS)},
            {"name": "Headquarters_City", "type": "singleLineText"},
            {
                "name": "Transit_Corridor",
                "type": "singleSelect",
                "options": select_options(TRANSIT_CORRIDORS),
            },
            {"name": "Facility_Type", "type": "singleSelect", "options": select_options(FACILITY_TYPES)},
            {"name": "Company_Logo", "type": "multipleAttachments"},
            {
                "name": "Record_Verification",
                "type": "singleSelect",
                "options": select_options(["Verified", "Unverified-Auto-Generated", "Under Review"]),
            },
        ],
    )

    job_postings = base.create_table(
        "Job_Postings",
        fields=[
            {"name": "Job_Title", "type": "singleLineText"},
            {"name": "Job_URL", "type": "url"},
            {
                "name": "Workplace_Type",
                "type": "singleSelect",
                "options": select_options(
                    [
                        "Strictly On-site",
                        "Hybrid (1-2 days/wk)",
                        "Hybrid (3-4 days/wk)",
                        "Remote (MA-Only)",
                    ]
                ),
            },
            {"name": "Facility_Type", "type": "singleSelect", "options": select_options(FACILITY_TYPES)},
            {
                "name": "Job_Function",
                "type": "singleSelect",
                "options": select_options(
                    [
                        "Founding & Executive",
                        "Machine Learning & AI",
                        "Software & Infrastructure",
                        "Robotics & Hardware",
                        "Biotech & Life Sciences",
                        "Product & Design",
                        "GTM & Sales",
                        "Marketing & Growth",
                        "Data & Analytics",
                        "Customer Success & Support",
                        "Operations, Finance & People",
                    ]
                ),
            },
            {
                "name": "Seniority",
                "type": "singleSelect",
                "options": select_options(
                    ["Entry-Level/Associate", "Mid-Level", "Senior", "Lead/Principal", "Executive (VP+)"]
                ),
            },
            {"name": "Is_Founding_Role", "type": "checkbox", "options": {"icon": "check", "color": "greenBright"}},
            {
                "name": "Technical_Domain",
                "type": "multipleSelects",
                "options": select_options(
                    [
                        "Molecular Modeling/TechBio",
                        "Physical AI/Robotics",
                        "LLM & Multi-Agent Systems",
                        "Computer Vision",
                        "Distributed Systems",
                        "Classical ML/Predictive Analytics",
                    ]
                ),
            },
            {
                "name": "Equity_Tier",
                "type": "singleSelect",
                "options": select_options(
                    ["High (>1.0%)", "Standard (0.25-1.0%)", "Disclosed on Request", "N/A"]
                ),
            },
            {"name": "Salary_Min", "type": "currency", "options": {"precision": 0, "symbol": "$"}},
            {"name": "Salary_Max", "type": "currency", "options": {"precision": 0, "symbol": "$"}},
            {
                "name": "Status",
                "type": "singleSelect",
                "options": select_options(["Active", "Closed", "Draft/Pending Review", "Rejected-Non-MA"]),
            },
            {"name": "Submission_Date", "type": "createdTime"},
            {"name": "Last_Liveness_Check", "type": "dateTime", "options": {
                "dateFormat": {"name": "iso"},
                "timeFormat": {"name": "24hour"},
                "timeZone": "America/New_York",
            }},
            {"name": "Liveness_HTTP_Code", "type": "number", "options": {"precision": 0}},
        ],
    )

    # --- Step 2: link fields (creates symmetric reverse links automatically) --
    base.table(vc_registry.id).create_field(
        "Portfolio_Companies", "multipleRecordLinks", options={"linkedTableId": portfolio_companies.id}
    )
    base.table(portfolio_companies.id).create_field(
        "Sponsoring_VCs", "multipleRecordLinks", options={"linkedTableId": vc_registry.id}
    )
    company_ref = base.table(job_postings.id).create_field(
        "Company_Ref", "multipleRecordLinks", options={"linkedTableId": portfolio_companies.id, "allowMultipleRecordsPerFieldForSameRecord": False}
    )
    base.table(job_postings.id).create_field(
        "Submitted_By_VC", "multipleRecordLinks", options={"linkedTableId": vc_registry.id}
    )

    print(
        "Created link fields. NOW GO RENAME the auto-generated reverse-link "
        "fields in the Airtable UI: VC_Registry's reverse of Job_Postings.Submitted_By_VC "
        "-> 'Submitted_Job_Postings'; Portfolio_Companies' reverse of Job_Postings.Company_Ref "
        "-> 'Active_Jobs'. The Metadata API does not expose a clean way to rename "
        "the auto-created reverse link on creation."
    )

    # --- Step 3: lookups on Job_Postings (depend on Company_Ref field id) -----
    lookup_targets = {
        "Company_Name_Lookup": "Company_Name",
        "Company_Logo_Lookup": "Company_Logo",
        "Funding_Stage_Lookup": "Funding_Stage",
        "Primary_Vertical_Lookup": "Primary_Vertical",
        "Secondary_Verticals_Lookup": "Secondary_Verticals",
        "Transit_Corridor_Lookup": "Transit_Corridor",
        "Sponsoring_VCs_Lookup": "Sponsoring_VCs",
    }
    portfolio_field_ids = {f["name"]: f["id"] for f in base.table(portfolio_companies.id).schema().fields}
    for lookup_name, source_field_name in lookup_targets.items():
        base.table(job_postings.id).create_field(
            lookup_name,
            "multipleLookupValues",
            options={
                "recordLinkFieldId": company_ref.id,
                "fieldIdInLinkedTable": portfolio_field_ids[source_field_name],
            },
        )

    # --- Step 4: formula fields ------------------------------------------
    base.table(job_postings.id).create_field(
        "Job_ID",
        "formula",
        options={"formula": 'CONCATENATE({Company_Name_Lookup}, " - ", {Job_Title}, " (", RECORD_ID(), ")")'},
    )
    base.table(job_postings.id).create_field(
        "Apply_URL",
        "formula",
        options={
            "formula": 'CONCATENATE({Job_URL}, IF(FIND("?", {Job_URL}) > 0, "&", "?"), "source=nevca_talent")'
        },
    )
    base.table(job_postings.id).create_field(
        "Active_Flag",
        "formula",
        options={"formula": "IF({Status} = 'Active', 1, 0)"},
    )
    base.table(job_postings.id).create_field(
        "Stage_Verification",
        "formula",
        options={
            "formula": "IF({Funding_Stage_Lookup} != '', 'Verified via Portfolio Master', 'Inferred from JD (Unverified)')"
        },
    )
    base.table(job_postings.id).create_field(
        "Expires_At",
        "formula",
        options={"formula": "DATEADD({Submission_Date}, 45, 'days')"},
    )

    # --- Step 5: Active_Jobs_Count rollup on VC_Registry ------------------
    # Depends on the reverse-link field (renamed manually per the printed
    # instruction above) and on Job_Postings.Active_Flag existing.
    job_postings_field_ids = {f["name"]: f["id"] for f in base.table(job_postings.id).schema().fields}
    vc_registry_field_ids = {f["name"]: f["id"] for f in base.table(vc_registry.id).schema().fields}
    base.table(vc_registry.id).create_field(
        "Active_Jobs_Count",
        "rollup",
        options={
            "recordLinkFieldId": vc_registry_field_ids["Submitted_Job_Postings"],
            "fieldIdInLinkedTable": job_postings_field_ids["Active_Flag"],
            "rollupFunction": "sum",
        },
    )

    print("Provisioning complete (steps 1-5). Create the Portfolio_Review_Queue view manually — see airtable-schema.md.")


if __name__ == "__main__":
    main()
