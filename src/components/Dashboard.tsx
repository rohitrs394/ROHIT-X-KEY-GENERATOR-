import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { GlassCard } from './ui/GlassCard';
import { Key, CheckCircle2, Pause, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  keys: any[];
  logs: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ keys, logs }) => {
  const stats = {
    total: keys.length,
    active: keys.filter(k => k.status === 'active').length,
    paused: keys.filter(k => k.status === 'paused').length,
    expired: keys.filter(k => k.status === 'expired').length,
  };

  // Prepare chart data (keys created per day)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'MMM d');
  }).reverse();

  const chartData = last7Days.map(day => {
    const count = keys.filter(k => k.createdAt && format(k.createdAt.toDate(), 'MMM d') === day).length;
    return { name: day, keys: count };
  });

  const pieData = [
    { name: 'Active', value: stats.active, color: '#10b981' },
    { name: 'Paused', value: stats.paused, color: '#f59e0b' },
    { name: 'Expired', value: stats.expired, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Keys', value: stats.total, icon: Key, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Paused', value: stats.paused, icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Expired', value: stats.expired, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="flex items-center gap-4 border-slate-800/50 hover:border-slate-700 transition-colors">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-cyan-400" size={20} />
              <h3 className="text-lg font-bold text-white">Key Generation Trend</h3>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="keys" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorKeys)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-8">Status Distribution</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {pieData.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</div>
                <div className="text-sm font-bold text-white">{d.value}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="text-purple-400" size={20} />
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          </div>
        </div>
        <div className="space-y-4">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <div className={`p-2 rounded-lg ${
                log.type === 'key_generated' ? 'bg-cyan-500/10 text-cyan-400' :
                log.type === 'key_verification' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-rose-500/10 text-rose-400'
              }`}>
                {log.type === 'key_generated' ? <Key size={16} /> : 
                 log.type === 'key_verification' ? <CheckCircle2 size={16} /> : 
                 <AlertCircle size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-300">{log.details}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, HH:mm:ss') : 'Just now'}
                  {log.ip && <span className="ml-2 text-slate-600">IP: {log.ip}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
