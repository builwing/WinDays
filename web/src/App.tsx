import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/stores/auth'
import AppShell from '@/components/AppShell'
import ConsentBanner from '@/components/ConsentBanner'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Today from '@/pages/Today'
import Dashboard from '@/pages/Dashboard'
import Categories from '@/pages/Categories'
import Settings from '@/pages/Settings'
import EmailVerified from '@/pages/EmailVerified'
import Welcome from '@/pages/Welcome'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true } },
})

function RequireAuth() {
  const token = useAuth((s) => s.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route element={<RequireAuth />}>
            <Route path="/app/welcome" element={<Welcome />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Today />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ConsentBanner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
