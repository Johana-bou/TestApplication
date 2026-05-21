import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pvApi } from '../../api/pvApi';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { 
  Printer, FileCheck, ArrowLeft, Plus, 
  Download, Monitor, X, Minus, Square, 
  Calendar, Hash, Wallet, History
} from 'lucide-react';
import { cn } from '../../lib/utils';

const ImpressionPV = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pv, setPv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadPV();
  }, [id]);

  const loadPV = async () => {
    try {
      const response = await pvApi.getProcesVerbal(id as string);
      setPv(response.data);
    } catch (error) {
      toast.error('Erreur de chargement du PV');
      navigate('/pv/nouveau');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await pvApi.printProcesVerbal(id as string);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PV_${pv.num_pv}_${pv.date_pv}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-blue-400 animate-pulse font-mono tracking-widest">LOADING PV DATA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
      {/* Desktop App Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col"
      >
        {/* Title Bar */}
        <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Confirmation d'Enregistrement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Minus className="w-3 h-3 text-slate-400" /></div>
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Square className="w-3 h-3 text-slate-400" /></div>
            <button onClick={() => navigate('/')} className="p-1 hover:bg-red-600 rounded transition-colors group"><X className="w-3 h-3 text-slate-400 group-hover:text-white" /></button>
          </div>
        </div>

        <div className="p-10">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <FileCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">PV Enregistré avec Succès</h1>
            <p className="text-slate-400 text-sm mt-2">Le procès-verbal a été archivé dans le système central.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 mb-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Hash className="w-3 h-3" /> Numéro PV
                </div>
                <div className="font-bold text-slate-700">{pv.num_pv}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" /> Date
                </div>
                <div className="font-bold text-slate-700">{new Date(pv.date_pv).toLocaleDateString('fr-CM')}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <History className="w-3 h-3" /> Période
                </div>
                <div className="font-bold text-slate-700 text-xs">
                  Du {new Date(pv.date_debut_periode).toLocaleDateString('fr-CM')} au {new Date(pv.date_fin_periode).toLocaleDateString('fr-CM')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Wallet className="w-3 h-3" /> Solde Théorique
                </div>
                <div className="font-bold text-blue-600">{pv.solde_theorique.toLocaleString()} FCFA</div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Virements</div>
                <div className="font-bold text-slate-700">{pv.virements?.length || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Chèques</div>
                <div className="font-bold text-slate-700">{pv.cheques?.length || 0}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePrint}
              disabled={printing}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/10",
                printing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-[0.99]"
              )}
            >
              {printing ? 'Génération...' : (
                <>
                  <Download className="w-4 h-4" /> Imprimer le Document PDF
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/pv/nouveau')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Nouveau PV
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Accueil
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImpressionPV;
