import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Header } from '@/ui/container/Header.tsx'
import { Account } from '@/pages/Account.tsx'
import { Setting } from '@/pages/Setting.tsx'
import { Theme } from '@/pages/Theme.tsx'
import { Top } from '@/pages/Top.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-svh flex-col font-sans">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Top />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/setting/account" element={<Account />} />
            <Route path="/setting/theme" element={<Theme />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
