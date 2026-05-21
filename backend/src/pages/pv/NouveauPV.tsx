import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pvApi } from '../../api/pvApi';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { 
  Plus, Trash2, Save, X, FileText, Calendar, 
  Calculator, CreditCard, CheckSquare, User as UserIcon,
  ChevronRight, Minus, Square, Monitor
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NouveauPV = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Mocking poste for UI demonstration as per original code logic
  const poste = JSON.parse(localStorage.getItem('poste') || '{"nom_poste": "Poste de Contrôle", "code_poste": "DLA-01", "id": "1"}');
  
  const [loading, setLoading] = useState(false);
  const [virements, setVirements] = useState<any[]>([]);
  const [cheques, setCheques] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    num_pv: '',
    date_pv: new Date().toISOString().split('T')[0],
    date_debut_periode: '',
    date_fin_periode: '',
    solde_dernier_controle: 0,
    mouvements_debiteurs: 0,
    mouvements_crediteurs: 0,
    observations: '',
    receveur_nom: user?.nom_complet || '',
    receveur_grade: 'Inspecteur du Trésor'
  });

  const soldeTheorique = Number(formData.solde_dernier_controle) + 
                         Number(formData.mouvements_debiteurs) - 
                         Number(formData.mouvements_crediteurs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addVirement = () => {
    setVirements([...virements, {
      date_virement: new Date().toISOString().split('T')[0],
      num_virement: '',
      montant: 0,
      observation: ''
    }]);
  };

  const updateVirement = (index: number, field: string, value: any) => {
    const newVirements = [...virements];
    newVirements[index][field] = value;
    setVirements(newVirements);
  };

  const removeVirement = (index: number) => {
    setVirements(virements.filter((_, i) => i !== index));
  };

  const addCheque = () => {
    setCheques([...cheques, {
      date_cheque: new Date().toISOString().split('T')[0],
      num_cheque: '',
      montant: 0,
      num_dr: '',
      observation: ''
    }]);
  };

  const updateCheque = (index: number, field: string, value: any) => {
    const newCheques = [...cheques];
    newCheques[index][field] = value;
    setCheques(newCheques);
  };

  const removeCheque = (index: number) => {
    setCheques(cheques.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        solde_theorique: soldeTheorique,
        difference: soldeTheorique - formData.solde_dernier_controle,
        poste_id: poste.id,
        utilisateur_id: user?.id || '1',
        virements: virements.filter(v => v.num_virement && v.montant > 0),
        cheques: cheques.filter(c => c.num_cheque && c.montant > 0)
      };

      const response = await pvApi.createProcesVerbal(payload);
      toast.success('PV enregistré avec succès');
      navigate(`/pv/impression/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col h-[90vh]"
      >
        {/* Title Bar */}
        <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Douanes du Cameroun - Nouveau Procès-Verbal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Minus className="w-3 h-3 text-slate-400" /></div>
            <div className="p-1 hover:bg-slate-700 rounded transition-colors"><Square className="w-3 h-3 text-slate-400" /></div>
            <button onClick={() => navigate('/')} className="p-1 hover:bg-red-600 rounded transition-colors group"><X className="w-3 h-3 text-slate-400 group-hover:text-white" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-slate-800 p-6 text-white hidden md:flex flex-col justify-between shrink-0">
            <div className="space-y-8">
              <div>
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Session Active</div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate">{user?.pseudo || 'Agent Douane'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{poste.nom_poste}</div>
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Sections</div>
                <a href="#general" className="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold transition-all">
                  <FileText className="w-4 h-4" /> Général
                </a>
                <a href="#caisse" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-all">
                  <Calculator className="w-4 h-4" /> Contrôle Caisse
                </a>
                <a href="#virements" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-all">
                  <CreditCard className="w-4 h-4" /> Virements
                </a>
                <a href="#cheques" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-all">
                  <CheckSquare className="w-4 h-4" /> Chèques
                </a>
              </nav>
            </div>

            <button 
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-sm font-bold transition-all"
            >
              <X className="w-4 h-4" /> Déconnexion
            </button>
          </div>

          {/* Main Form Area */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {/* Section: Général */}
              <section id="general" className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Informations Générales</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Numéro PV *</label>
                    <input
                      type="text"
                      name="num_pv"
                      value={formData.num_pv}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                      required
                      placeholder="Ex: 001/2026"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date du PV *</label>
                    <input
                      type="date"
                      name="date_pv"
                      value={formData.date_pv}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Début Période *</label>
                    <input
                      type="date"
                      name="date_debut_periode"
                      value={formData.date_debut_periode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fin Période *</label>
                    <input
                      type="date"
                      name="date_fin_periode"
                      value={formData.date_fin_periode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Section: Contrôle Caisse */}
              <section id="caisse" className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Contrôle de Caisse</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Solde Dernier Contrôle</label>
                    <input
                      type="number"
                      name="solde_dernier_controle"
                      value={formData.solde_dernier_controle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mouvements Débiteurs</label>
                    <input
                      type="number"
                      name="mouvements_debiteurs"
                      value={formData.mouvements_debiteurs}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mouvements Créditeurs</label>
                    <input
                      type="number"
                      name="mouvements_crediteurs"
                      value={formData.mouvements_crediteurs}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 flex items-center justify-between text-white shadow-xl shadow-blue-900/10">
                  <div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Solde Théorique Calculé</div>
                    <div className="text-3xl font-black tracking-tighter">{soldeTheorique.toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span></div>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </section>

              {/* Section: Virements */}
              <section id="virements" className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Situation des Virements</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addVirement}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>

                <div className="space-y-4">
                  {virements.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
                      Aucun virement enregistré
                    </div>
                  )}
                  {virements.map((v, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={index} 
                      className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group"
                    >
                      <button 
                        type="button"
                        onClick={() => removeVirement(index)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                          <input
                            type="date"
                            value={v.date_virement}
                            onChange={(e) => updateVirement(index, 'date_virement', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N° Virement</label>
                          <input
                            type="text"
                            value={v.num_virement}
                            onChange={(e) => updateVirement(index, 'num_virement', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            placeholder="2030054"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Montant</label>
                          <input
                            type="number"
                            value={v.montant}
                            onChange={(e) => updateVirement(index, 'montant', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <input
                          type="text"
                          value={v.observation}
                          onChange={(e) => updateVirement(index, 'observation', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          placeholder="Observations..."
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Section: Chèques */}
              <section id="cheques" className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Situation des Chèques</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addCheque}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>

                <div className="space-y-4">
                  {cheques.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
                      Aucun chèque enregistré
                    </div>
                  )}
                  {cheques.map((c, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={index} 
                      className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group"
                    >
                      <button 
                        type="button"
                        onClick={() => removeCheque(index)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                          <input
                            type="date"
                            value={c.date_cheque}
                            onChange={(e) => updateCheque(index, 'date_cheque', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N° Chèque</label>
                          <input
                            type="text"
                            value={c.num_cheque}
                            onChange={(e) => updateCheque(index, 'num_cheque', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            placeholder="123456"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Montant</label>
                          <input
                            type="number"
                            value={c.montant}
                            onChange={(e) => updateCheque(index, 'montant', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N° DR</label>
                          <input
                            type="text"
                            value={c.num_dr}
                            onChange={(e) => updateCheque(index, 'num_dr', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <input
                          type="text"
                          value={c.observation}
                          onChange={(e) => updateCheque(index, 'observation', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          placeholder="Observations..."
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Observations Finales */}
              <section className="space-y-6 pb-10">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Observations & Signature</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observations Générales</label>
                    <textarea
                      name="observations"
                      value={formData.observations}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                      placeholder="SITUATION CONFORME, etc."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom du Receveur</label>
                      <input
                        type="text"
                        name="receveur_nom"
                        value={formData.receveur_nom}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grade du Receveur</label>
                      <input
                        type="text"
                        name="receveur_grade"
                        value={formData.receveur_grade}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
              >
                Annuler
              </button>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-lg font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/10",
                    loading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-[0.98]"
                  )}
                >
                  {loading ? 'Enregistrement...' : (
                    <>
                      <Save className="w-4 h-4" /> Enregistrer et Imprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default NouveauPV;
