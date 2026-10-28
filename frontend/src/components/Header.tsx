import type { ReactNode } from 'react'
import { PostRoleButton } from './PostRoleButton'

export type Tab = 'jobs' | 'companies'

export function Header({ tab, onTabChange }: { tab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">MA Talent Exchange</p>
          <p className="text-xs text-slate-500">Proof of concept — placeholder branding</p>
        </div>
        <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <TabButton active={tab === 'jobs'} onClick={() => onTabChange('jobs')}>
            Jobs
          </TabButton>
          <TabButton active={tab === 'companies'} onClick={() => onTabChange('companies')}>
            Companies
          </TabButton>
        </nav>
        <PostRoleButton />
      </div>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}
