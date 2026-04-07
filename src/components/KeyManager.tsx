import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Copy, Trash2, Pause, Play, 
  Download, Filter, Smartphone, ExternalLink, 
  AlertTriangle, X, Zap, Key as KeyIcon, 
  Layers, CheckCircle2, Clock
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { NeonButton } from './ui/NeonButton';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface KeyManagerProps {
  keys: any[];
  onGenerate: (data: any) => void;
  onBulkGenerate: (data: any, count: number) => void;
  onToggleStatus: (key: any) => void;
  onDelete: (key: any) => void;
  onCopy: (text: string) => void;
}

export const KeyManager: React.FC<KeyManagerProps> = ({ 
  keys, onGenerate, onBulkGenerate, onToggleStatus, onDelete, onCopy 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<any | null>(null);
  
  const [newKeyData, setNewKeyData] = useState({
    prefix: 'ROHIT',
    expiryType: '1day',
    customDate: '',
    note: '',
    appName: '',
    appLink: '',
    bindDevice: false
  });

  const [bulkData, setBulkData] = useState({
    prefix: 'ROHIT',
    count: 10,
    expiryType: '1day',
    customDate: '',
    note: '',
    appName: '',
  });

  const filteredKeys = keys.filter(k => 
    k.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
    k.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.appName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Key', 'Status', 'Expiry Type', 'Expiry Date', 'App Name', 'Note', 'Created At'];
    const rows = filteredKeys.map(k => [
      k.key,
      k.status,
      k.expiryType,
      k.expiryDate instanceof Timestamp ? format(k.expiryDate.toDate(), 'yyyy-MM-dd HH:mm:ss') : k.expiryDate,
      k.appName || '',
      k.note || '',
      k.createdAt instanceof Timestamp ? format(k.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `keys_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search keys, apps, or notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
          </div>
          <NeonButton onClick={exportToCSV} variant="secondary" className="px-4" icon={Download}>
            <span className="hidden sm:inline">Export</span>
          </NeonButton>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <NeonButton onClick={() => setIsBulkModalOpen(true)} variant="secondary" className="flex-1 lg:flex-none" icon={Layers}>
            Bulk Gen
          </NeonButton>
          <NeonButton onClick={() => setIsAddModalOpen(true)} className="flex-1 lg:flex-none" icon={Plus}>
            New Key
          </NeonButton>
        </div>
      </div>

      {/* Keys Table */}
      <GlassCard className="p-0 overflow-hidden border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Key Details</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Expiry</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">App / Note</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white font-bold tracking-wider group-hover:text-cyan-400 transition-colors">{k.key}</span>
                      <button onClick={() => onCopy(k.key)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition-all">
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock size={10} className="text-slate-600" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {k.createdAt ? format(k.createdAt.toDate(), 'MMM d, yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                      k.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${k.status === 'active' ? 'bg-emerald-400' : k.status === 'paused' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      {k.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-200">{k.expiryType === 'lifetime' ? 'Lifetime' : k.expiryDate instanceof Timestamp ? format(k.expiryDate.toDate(), 'MMM d, yyyy') : 'N/A'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{k.expiryType}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Smartphone size={12} className="text-cyan-500/50" />
                      <p className="text-sm font-bold text-slate-300 truncate max-w-[150px]">{k.appName || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[150px] mt-1 italic">{k.note || '-'}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onToggleStatus(k)}
                        className={`p-2.5 rounded-xl transition-all border border-transparent hover:border-current ${k.status === 'active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                        title={k.status === 'active' ? 'Pause Key' : 'Activate Key'}
                      >
                        {k.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button 
                        onClick={() => setKeyToDelete(k)}
                        className="p-2.5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl transition-all border border-transparent"
                        title="Delete Key"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKeys.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-slate-900 text-slate-700">
                        <Search size={48} />
                      </div>
                      <p className="text-slate-500 font-bold">No keys found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Key Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg">
              <GlassCard className="border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Generate <span className="text-cyan-400">Key</span></h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-lg bg-slate-900 text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Prefix</label>
                      <input type="text" value={newKeyData.prefix} onChange={(e) => setNewKeyData({...newKeyData, prefix: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="ROHIT" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Type</label>
                      <select value={newKeyData.expiryType} onChange={(e) => setNewKeyData({...newKeyData, expiryType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors">
                        <option value="1day">1 Day</option>
                        <option value="7days">7 Days</option>
                        <option value="custom">Custom Date</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                  </div>
                  {newKeyData.expiryType === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Expiry Date</label>
                      <input type="datetime-local" value={newKeyData.customDate} onChange={(e) => setNewKeyData({...newKeyData, customDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Name</label>
                    <input type="text" value={newKeyData.appName} onChange={(e) => setNewKeyData({...newKeyData, appName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="e.g. My Premium App" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Note (Optional)</label>
                    <textarea value={newKeyData.note} onChange={(e) => setNewKeyData({...newKeyData, note: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors h-24 resize-none" placeholder="Add a private note..." />
                  </div>
                  <NeonButton onClick={() => { onGenerate(newKeyData); setIsAddModalOpen(false); }} className="w-full py-4 text-lg" icon={Zap}>Generate Now</NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* Bulk Generate Modal */}
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg">
              <GlassCard className="border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Bulk <span className="text-purple-400">Generate</span></h3>
                  <button onClick={() => setIsBulkModalOpen(false)} className="p-2 rounded-lg bg-slate-900 text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Prefix</label>
                      <input type="text" value={bulkData.prefix} onChange={(e) => setBulkData({...bulkData, prefix: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" placeholder="ROHIT" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                      <input type="number" min="1" max="100" value={bulkData.count} onChange={(e) => setBulkData({...bulkData, count: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Type</label>
                    <select value={bulkData.expiryType} onChange={(e) => setBulkData({...bulkData, expiryType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors">
                      <option value="1day">1 Day</option>
                      <option value="7days">7 Days</option>
                      <option value="custom">Custom Date</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Name</label>
                    <input type="text" value={bulkData.appName} onChange={(e) => setBulkData({...bulkData, appName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. My Premium App" />
                  </div>
                  <NeonButton onClick={() => { onBulkGenerate(bulkData, bulkData.count); setIsBulkModalOpen(false); }} variant="secondary" className="w-full py-4 text-lg" icon={Layers}>Generate {bulkData.count} Keys</NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation */}
        {keyToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setKeyToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm">
              <GlassCard className="border-rose-500/30 text-center space-y-6">
                <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Key?</h3>
                  <p className="text-slate-400 mt-2">Are you sure you want to delete <span className="text-white font-mono">{keyToDelete.key}</span>? This action cannot be undone.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setKeyToDelete(null)} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all">Cancel</button>
                  <button onClick={() => { onDelete(keyToDelete); setKeyToDelete(null); }} className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]">Delete</button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
