import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import Layout from './components/layout/Layout'
import { PreLoader } from './components/layout/PreLoader'

// Guards
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { AdminRoute } from './components/shared/AdminRoute'

// Auth pages
import PosteSelection from './pages/auth/PosteSelection'
import Login from './pages/auth/Login'

// Main pages
import Dashboard from './pages/dashboard/Dashboard'
import PVList from './pages/pv/PVList'
import PVForm from './pages/pv/PVForm'
import PVDetail from './pages/pv/PVDetail'
import EncaissementList from './pages/encaissements/EncaissementList'
import EncaissementSaisie from './pages/encaissements/EncaissementSaisie'
import Rapports from './pages/rapports/Rapports'
import EtatNominatifList from './pages/etats-nominatifs/EtatNominatifList'
import EtatNominatifForm from './pages/etats-nominatifs/EtatNominatifForm'
import EtatNominatifDetail from './pages/etats-nominatifs/EtatNominatifDetail'
import RapprochementList from './pages/rapprochement/RapprochementList'
import RapprochementForm from './pages/rapprochement/RapprochementForm'
import RapprochementDetail from './pages/rapprochement/RapprochementDetail'
import Profil from './pages/profil/Profil'

// Admin pages
import Unites from './pages/admin/Unites'
import Usagers from './pages/admin/Usagers'
import Comptes from './pages/admin/Comptes'
import LignesBudgetaires from './pages/admin/LignesBudgetaires'
import Utilisateurs from './pages/admin/Utilisateurs'
import Affectations from './pages/admin/Affectations'
import AuditLogs from './pages/admin/AuditLogs'
import Notifications from './pages/admin/Notifications'
import ConfigImpression from './pages/admin/ConfigImpression'

function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <>
      <PreLoader />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <PosteSelection />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Profil */}
          <Route path="/profil" element={<Profil />} />

          {/* PV */}
          <Route path="/pv" element={<PVList />} />
          <Route path="/pv/nouveau" element={<PVForm />} />
          <Route path="/pv/:id" element={<PVDetail />} />
          <Route path="/pv/:id/modifier" element={<PVForm />} />

          {/* Encaissements */}
          <Route path="/encaissements" element={<EncaissementList />} />
          <Route path="/encaissements/saisie" element={<EncaissementSaisie />} />

          {/* Rapports */}
          <Route path="/rapports" element={<Rapports />} />

          {/* États nominatifs */}
          <Route path="/etats-nominatifs" element={<EtatNominatifList />} />
          <Route path="/etats-nominatifs/nouveau" element={<EtatNominatifForm />} />
          <Route path="/etats-nominatifs/:id" element={<EtatNominatifDetail />} />

          {/* Rapprochement */}
          <Route path="/rapprochement" element={<RapprochementList />} />
          <Route path="/rapprochement/nouveau" element={<RapprochementForm />} />
          <Route path="/rapprochement/:id" element={<RapprochementDetail />} />

          {/* Admin routes */}
          <Route path="/admin/unites" element={<AdminRoute><Unites /></AdminRoute>} />
          <Route path="/admin/usagers" element={<AdminRoute><Usagers /></AdminRoute>} />
          <Route path="/admin/comptes" element={<AdminRoute><Comptes /></AdminRoute>} />
          <Route path="/admin/lignes-budgetaires" element={<AdminRoute><LignesBudgetaires /></AdminRoute>} />
          <Route path="/admin/utilisateurs" element={<AdminRoute><Utilisateurs /></AdminRoute>} />
          <Route path="/admin/affectations" element={<AdminRoute><Affectations /></AdminRoute>} />
          <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
          <Route path="/admin/config-impression" element={<AdminRoute><ConfigImpression /></AdminRoute>} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  )
}

export default App
