# LLM Normalization — Prompt & Test Harness

Workstream 4 from SPEC.md §13: finalize the gpt-4o-mini job-posting normalization
prompt and build a test harness for it.

- `prompt.md` — the finalized system prompt, JSON output schema, and user-message
  template, reconciled from the several draft iterations in
  `job-aggregator-chat-content.md` against SPEC.md §6/§6.1. Read the "Reconciliation
  judgment calls" section at the bottom before treating it as final.
- `test_cases.json` — 12 synthetic raw job-posting fixtures with expected normalized
  output, covering: MA on-site wet-lab, MA hybrid hardware, founding ML role, MA
  remote (residency-restricted), out-of-state rejection, ambiguous funding stage,
  unrestricted "Remote - US" posting, an OpenGraph-only anti-bot-fallback case, a
  multi-vertical (primary + secondary) case, a Marketing & Growth role, a Data &
  Analytics role, and a Cybersecurity-vertical role exercising the Classical ML /
  Predictive Analytics technical domain.
- `test_harness.py` — calls gpt-4o-mini against each fixture and diffs actual vs.
  expected output on enum/boolean/number fields only (free-text fields like
  `description_summary`/`skills`/`city` are not strictly diffed).

## Status: not yet validated against a live model

**This has only been checked offline** (prompt extraction regex, JSON fixture
structure, and the harness's no-API-key code path all verified to work). It has
**not** been run against the real `gpt-4o-mini` API — that requires an `OPENAI_API_KEY`
with billing enabled (see SPEC.md §12 checklist), which wasn't available to this
agent. Run it before trusting the prompt:

```
OPENAI_API_KEY=sk-... python3 test_harness.py
```

If cases fail, the most likely culprits are: the model picking a different but
reasonable-sounding transit corridor/vertical label, or disagreeing on equity-tier
default when equity is implied but no range is given — tighten `prompt.md`'s wording
for those cases first before assuming the harness itself is wrong.

## Taxonomy revision (resolved)

SPEC.md §6's canonical taxonomy was revised after this gap was surfaced: `job_function`
gained `Marketing & Growth`, `Data & Analytics`, `Customer Success & Support` (and
`Operations & People` was renamed to `Operations, Finance & People`);
`primary_vertical`/`secondary_verticals` gained `Cybersecurity`; `technical_domain`
gained `Classical ML / Predictive Analytics`. `prompt.md` and `test_cases.json` have
been updated to match — see `prompt.md`'s "Reconciliation judgment calls" §5 for
details. `test_case` `remote_us_unrestricted` was corrected from `GTM & Sales` to
`Marketing & Growth`, and `ambiguous_funding_stage_generalist` from `Operations &
People` to `Operations, Finance & People`.
