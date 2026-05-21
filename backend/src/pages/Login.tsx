import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { Lock, User, ArrowLeft, LogIn, X, Minus, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    code_poste: '',
    pseudo: '',
    mot_de_passe: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem('selectedPosteCode');
    if (savedCode) {
      setFormData(prev => ({ ...prev, code_poste: savedCode }));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Connexion réussie');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
      {/* Desktop App Window */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col"
      >
        {/* Title Bar */}
        <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Douanes du Cameroun - Authentification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Minus className="w-3 h-3 text-slate-400" /></div>
            <div className="p-1 hover:bg-slate-700 rounded transition-colors group"><X className="w-3 h-3 text-slate-400 group-hover:text-white" /></div>
          </div>
        </div>

        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Connexion</h2>
              <p className="text-slate-400 text-xs font-bold uppercase mt-1">Système de contrôle interne</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
              title="Changer de poste"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
            <div className="text-[10px] uppercase font-black text-blue-600 tracking-widest mb-1">Poste Actif</div>
            <div className="text-blue-900 font-bold text-sm">{formData.code_poste}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Identifiant Agent
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="pseudo"
                  value={formData.pseudo}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  placeholder="Pseudo"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Clé d'accès
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm uppercase tracking-widest transition-all mt-4 shadow-lg shadow-blue-900/10",
                loading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-[0.99]"
              )}
            >
              {loading ? 'Authentification...' : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrer dans la session</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
