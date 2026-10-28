import { useState } from 'react'
import { CompaniesPage } from './components/CompaniesPage'
import { Header, type Tab } from './components/Header'
import { JobsPage } from './components/JobsPage'

function App() {
  const [tab, setTab] = useState<Tab>('jobs')

  return (
    <div className="min-h-screen bg-slate-50">
      <Header tab={tab} onTabChange={setTab} />
      {tab === 'jobs' ? <JobsPage /> : <CompaniesPage />}
    </div>
  )
}

export default App
