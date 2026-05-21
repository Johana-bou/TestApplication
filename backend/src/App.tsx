import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Accueil from './pages/Accueil';
import Login from './pages/Login';
import NouveauPV from './pages/pv/NouveauPV';
import ImpressionPV from './pages/pv/ImpressionPV';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pv/nouveau" element={<NouveauPV />} />
          <Route path="/pv/impression/:id" element={<ImpressionPV />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer 
          aria-label="Notifications"
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}
