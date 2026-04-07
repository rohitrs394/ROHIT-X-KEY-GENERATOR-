import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  History, Search, Filter, Trash2, 
  Download, Clock, User, Globe, 
  Shield, Activity, Key as KeyIcon, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { NeonButton } from './ui/NeonButton';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface LogsProps {
  logs: any[];
  onClearLogs: () => void;
}

export const Logs: React.FC<LogsProps> = ({ logs, onClearLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         log.ip?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const exportLogs = () => {
    const headers = ['Type', 'Details', 'IP Address', 'Timestamp', 'Admin ID'];
    const rows = filteredLogs.map(l => [
      l.type,
      l.details,
      l.ip || 'N/A',
      l.timestamp instanceof Timestamp ? format(l.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
      l.adminId || 'system'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search logs or IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="all">All Types</option>
            <option value="key_generated">Key Generation</option>
            <option value="key_verification">Key Verification</option>
            <option value="key_deleted">Key Deletion</option>
            <option value="key_status_change">Status Change</option>
          </select>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <NeonButton onClick={exportLogs} variant="secondary" className="flex-1 lg:flex-none" icon={Download}>
            Export
          </NeonButton>
          <NeonButton onClick={onClearLogs} variant="danger" className="flex-1 lg:flex-none" icon={Trash2}>
            Clear
          </NeonButton>
        </div>
      </div>

      {/* Logs List */}
      <GlassCard className="p-0 overflow-hidden border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Event</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Details</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">IP Address</th>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.type === 'key_generated' ? 'bg-cyan-500/10 text-cyan-400' :
                        log.type === 'key_verification' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.type === 'key_deleted' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.type === 'key_generated' ? <KeyIcon size={16} /> : 
                         log.type === 'key_verification' ? <CheckCircle2 size={16} /> : 
                         log.type === 'key_deleted' ? <Trash2 size={16} /> :
                         <Activity size={16} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                        {log.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-400 max-w-md">{log.details}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Globe size={14} />
                      <span className="text-xs font-mono">{log.ip || 'Internal'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={14} className="text-slate-600" />
                        <span className="text-xs font-bold">
                          {log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                        {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-slate-900 text-slate-700">
                        <History size={48} />
                      </div>
                      <p className="text-slate-500 font-bold">No activity logs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
