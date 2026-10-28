export function CheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly T[]
  selected: Set<T>
  onToggle: (value: T) => void
}) {
  return (
    <fieldset className="border-b border-slate-200 py-4">
      <legend className="mb-2 text-sm font-semibold text-slate-800">{label}</legend>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={selected.has(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
