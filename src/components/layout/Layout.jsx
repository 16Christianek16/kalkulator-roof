import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen print:block" style={{ background: '#f1f5f9' }}>
      <div className="print:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header onMenuToggle={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
