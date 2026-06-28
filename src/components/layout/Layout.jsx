import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import Statusbar from './Statusbar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen print:block" style={{ background: 'var(--cream)' }}>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-5 lg:p-7 print:overflow-visible print:p-0">
        <Outlet />
      </main>
      <Statusbar />
    </div>
  )
}
