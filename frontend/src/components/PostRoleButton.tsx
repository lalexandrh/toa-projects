// INTEGRATION SEAM — this will become the gated member-submission entry point
// (SPEC.md §4 Track 2: Fillout/Softr form -> Make.com webhook, gated by VC access
// code). Non-functional by design until that pipeline exists.
export function PostRoleButton() {
  return (
    <button
      type="button"
      disabled
      title="Coming soon: VC-code-gated submission portal (SPEC.md §4, Track 2)"
      className="cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
    >
      Post a Role (VC Access)
    </button>
  )
}
