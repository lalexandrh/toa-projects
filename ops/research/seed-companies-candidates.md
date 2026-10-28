# Cold-start seed candidates — for human review, not a decision

This is a candidate list for SPEC.md §4 Track 1 (cold-start bulk seed) and §12 ("Select
the ~15 flagship MA portfolio companies"). **Nothing here is final.** Final selection —
which companies to actually scrape and showcase in the first demo — is a strategic/
political call reserved for the human per SPEC.md §12, not something this research
should decide. Treat the "Confidence" and "Flags" columns as the main signal: several
entries have real caveats (public companies, financial distress, unconfirmed ATS) that
should factor into selection.

ATS board slugs below were only included when a real, current URL was found during
research (web search, Oct 2026) — none are guessed. Where a company clearly uses an ATS
but the exact board slug wasn't confirmed, that's noted as "unconfirmed slug."

| Company | Primary vertical (§6) | ATS / board identifier | HQ (MA) | Stage / funding note | Confidence | Flags |
|---|---|---|---|---|---|---|
| Tessera Therapeutics | Biotech & Life Sciences | Greenhouse — `job-boards.greenhouse.io/tesseratherapeutics` | Cambridge/Somerville | Flagship Pioneering-founded; well past seed, growth-stage | High (board confirmed) | Later-stage than typical NEVCA seed/Series A target |
| Nuvalent | Biotech & Life Sciences | Greenhouse — `job-boards.greenhouse.io/nuvalent` | Cambridge | Public company (Nasdaq: NUVL) | High (board confirmed) | Public — likely not a current VC "portfolio company" in the NEVCA sense |
| Manifold Bio | Biotech & Life Sciences | Greenhouse — `job-boards.greenhouse.io/manifoldbio` | Not independently confirmed as MA in this pass | Early-stage (signal: active BD role posted) | Medium (board confirmed, HQ not reverified) | Confirm MA HQ before using |
| PathAI | AI & DeepTech / HealthTech crossover | Greenhouse — `job-boards.greenhouse.io/pathai` | Boston (Fenway) | Growth-stage | High | Good cross-vertical example (AI + digital health) |
| Cohere Health | HealthTech & Digital Health | Greenhouse — `job-boards.greenhouse.io/coherehealth` | Boston | Growth-stage | High | Mostly-remote team with a Boston office — good test case for the workplace_type/remote fields |
| Devoted Health | HealthTech & Digital Health | Not confirmed in this pass | Waltham | Large, late-stage (~1,100+ employees per Built In) | Low (ATS unverified) | Needs follow-up search before use |
| Formlabs | Robotics & Hardware | Greenhouse-powered (`careers.formlabs.com`); exact board slug unconfirmed | Somerville | Mature private company | Medium (ATS platform confirmed, slug not) | Good hardware/manufacturing example |
| Vicarious Surgical | Robotics & Hardware | Greenhouse — `boards.greenhouse.io/embed/job_board?for=vicarioussurgical` | Waltham | Public (NYSE: RBOT) | High (board confirmed) | **Caution:** recent reporting (per search, Oct 2026) describes major financial distress / a board proposal to dissolve — risky pick for an "actively hiring" demo |
| CircuitHub | Robotics & Hardware | Ashby — `jobs.ashbyhq.com/circuithub` | South Deerfield (Western MA, ~90 min from Boston) | Growth-stage; customers include Tesla, Meta, Zipline per search | High (board confirmed) | Outside Greater Boston commuting corridors — good test case for transit_corridor = Route 495/Outer Suburbs or a new "Western MA" value |
| RightHand Robotics | Robotics & Hardware | Not confirmed on Greenhouse/Ashby/Lever; listings route through a Playground Global (investor) job board aggregator | Somerville | Early-growth | Low (ATS unverified) | Needs a direct ATS link before use in the real pipeline |
| Commonwealth Fusion Systems | ClimateTech & Clean Energy | Lever — `jobs.lever.co/cfsenergy` | Cambridge/Somerville/Devens | Growth-stage, well-funded | High (board confirmed) | Strong, recognizable flagship example |
| Sublime Systems | ClimateTech & Clean Energy | Lever — `jobs.lever.co/SublimeSystems` | Somerville | Series B+ | High (board confirmed) | **Caution:** search surfaced reports of ~2/3 workforce layoff and a paused facility in late 2025/early 2026 — board exists but may have few/no live postings |
| Lightmatter | AI & DeepTech | Greenhouse — `job-boards.greenhouse.io/lightmatter` | Boston (dual HQ w/ Mountain View, CA) | Series D, $4.4B valuation per search | High (board confirmed) | Confirm which open roles are MA-based vs. CA-based before seeding |
| Klaviyo | Enterprise SaaS | Greenhouse — `job-boards.greenhouse.io/klaviyojobs` (general) and `job-boards.greenhouse.io/klaviyocampus` (internships) | Boston | Public (NYSE: KVYO) | High (board confirmed) | Public, large — strong brand recognition for a demo but not a typical early-stage NEVCA portfolio co |
| Rapid7 | Enterprise SaaS / Security | Not confirmed in this pass | Boston | Public, large (11,000+ customers per search) | Low (ATS unverified) | Likely too large/late-stage to be a representative "portfolio company" example |

## Gaps to flag

- **FinTech & InsurTech**: no candidate with a confirmed public ATS board was found in
  this research pass. Worth a follow-up search for specific named Boston-area fintech/
  insurtech startups (the general query didn't surface one) — or ask NEVCA members
  directly, since many fintechs in this stage range don't rank highly in generic search.
- Several strong-brand candidates (Klaviyo, Nuvalent, Vicarious Surgical, Rapid7) are
  now **public companies**, which may undercut the pitch that this is a VC-portfolio-
  exclusive talent pool — worth deciding whether "went public" or "distressed/
  downsizing" companies should be excluded from the final 15 even though their boards
  are real and scrapeable.
- Net usable count after flags: **~9 high-confidence, not-obviously-compromised
  candidates** (Tessera, PathAI, Cohere Health, Formlabs, CircuitHub, Commonwealth
  Fusion Systems, Lightmatter, Manifold Bio pending HQ confirmation, plus whichever of
  the public/distressed ones the human decides are still acceptable). More research
  needed to reach a clean list of 15, particularly for FinTech/InsurTech and a few more
  Robotics/AI names.
