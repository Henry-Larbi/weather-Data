/**
 * App — providers + routes.
 *
 * Provider order matters: Auth first (Progress depends on the current user),
 * then Content, then Progress. Routes are nested under the shared Layout.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './state/AuthContext'
import { ContentProvider } from './state/ContentContext'
import { ProgressProvider } from './state/ProgressContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ModulePage from './pages/ModulePage'
import FlashcardsPage from './pages/FlashcardsPage'
import PlaygroundPage from './pages/PlaygroundPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <ProgressProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="module/:moduleId" element={<ModulePage />} />
                <Route path="flashcards" element={<FlashcardsPage />} />
                <Route path="playground" element={<PlaygroundPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="*" element={<HomePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProgressProvider>
      </ContentProvider>
    </AuthProvider>
  )
}
