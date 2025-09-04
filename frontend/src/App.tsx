import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CurationPage from '@/pages/curation/CurationPage'
import ApprovedDocumentsPage from '@/pages/curation/ApprovedDocumentsPage'
import ArticleRouter from '@/pages/articles/ArticleRouter'
import ArticleEditorPage from '@/pages/articles/ArticleEditorPage'
import PublicPortalPage from '@/pages/public/PublicPortalPage'
import PublicArticlePage from '@/pages/public/PublicArticlePage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal" element={<PublicPortalPage />} />
        <Route path="/portal/articles/:slug" element={<PublicArticlePage />} />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/curation" element={<CurationPage />} />
                  <Route path="/approved" element={<ApprovedDocumentsPage />} />
                  <Route path="/articles" element={<ArticleRouter />} />
                  <Route path="/articles/:id/edit" element={<ArticleEditorPage />} />
                  <Route path="/articles/new" element={<ArticleEditorPage />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App