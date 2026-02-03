import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TopicIntake from './pages/TopicIntake'
import TopicDashboard from './pages/TopicDashboard'
import ContentView from './pages/ContentView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<TopicDashboard />} />
        <Route path="submit" element={<TopicIntake />} />
        <Route path="content/:id" element={<ContentView />} />
      </Route>
    </Routes>
  )
}

export default App

