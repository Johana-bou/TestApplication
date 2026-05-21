import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { Building2, ChevronRight, Monitor, X, Minus, Square } from 'lucide-react';
import { cn } from '../lib/utils';

const Accueil = () => {
  const navigate = useNavigate();
  const [postes, setPostes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadPostes();
  }, []);

  const loadPostes = async () => {
    try {
      const response: any = await authApi.getPostes();
      setPostes(response.data);
    } catch (error) {
      toast.error('Erreur de chargement des postes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPoste = async () => {
    if (!selectedCode) {
      toast.warning('Veuillez sélectionner un poste');
      return;
    }

    setVerifying(true);
    try {
      await authApi.verifyPoste(selectedCode);
      localStorage.setItem('selectedPosteCode', selectedCode);
      navigate('/login');
    } catch (error) {
      toast.error('Code poste invalide');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e]">
        <div className="text-blue-400 animate-pulse font-mono">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
      {/* Desktop App Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[#f1f5f9] rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col"
      >
        {/* Title Bar */}
        <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Douanes du Cameroun - Terminal v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Minus className="w-3 h-3 text-slate-400" /></div>
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Square className="w-3 h-3 text-slate-400" /></div>
            <div className="p-1 hover:bg-red-600 rounded transition-colors group"><X className="w-3 h-3 text-slate-400 group-hover:text-white" /></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Sidebar Info */}
          <div className="w-full md:w-64 bg-slate-800 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-black leading-tight mb-2">SÉLECTION DU POSTE</h1>
              <p className="text-slate-400 text-xs leading-relaxed">
                Veuillez identifier votre poste de contrôle pour accéder au système de gestion des procès-verbaux.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-1 w-12 bg-blue-500 rounded-full" />
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                République du Cameroun
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Postes disponibles ({postes.length})
              </label>
              
              {postes.map((poste) => (
                <button
                  key={poste.id}
                  onClick={() => setSelectedCode(poste.code_poste)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between group",
                    selectedCode === poste.code_poste
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <div className={cn(
                      "font-bold text-sm",
                      selectedCode === poste.code_poste ? "text-blue-700" : "text-slate-700"
                    )}>
                      {poste.nom_poste}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      CODE: {poste.code_poste}
                    </div>
                  </div>
                  {selectedCode === poste.code_poste && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={handleSelectPoste}
                disabled={verifying || !selectedCode}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all",
                  verifying || !selectedCode
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-[0.99]"
                )}
              >
                {verifying ? 'Traitement...' : 'Valider la sélection'}
                {!verifying && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Accueil;
