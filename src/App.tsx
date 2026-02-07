import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TopicIntake from './pages/TopicIntake'
import TopicDashboard from './pages/TopicDashboard'
import ContentView from './pages/ContentView'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/check', { credentials: 'include' })
      if (response.ok) {
        setAuthenticated(true)
      }
    } catch {
      // Not authenticated
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return null // Brief loading state while checking auth
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout onLogout={() => setAuthenticated(false)} />}>
        <Route index element={<TopicDashboard />} />
        <Route path="submit" element={<TopicIntake />} />
        <Route path="content/:id" element={<ContentView />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

