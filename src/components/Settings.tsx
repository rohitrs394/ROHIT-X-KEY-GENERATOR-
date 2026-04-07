import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Shield, Bell, 
  Database, Globe, Lock, Smartphone, 
  Trash2, Save, RefreshCw, Zap, 
  AlertTriangle, CheckCircle2, User
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { NeonButton } from './ui/NeonButton';

interface SettingsProps {
  user: any;
  onUpdateSettings: (settings: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateSettings }) => {
  const [settings, setSettings] = useState({
    defaultPrefix: 'ROHIT',
    maintenanceMode: false,
    requireDeviceBinding: true,
    logVerifications: true,
    apiRateLimit: 100,
    notificationEmail: user.email || 'admin@system.local',
  });

  const handleSave = () => {
    onUpdateSettings(settings);
    // Show success toast or similar
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">System <span className="text-cyan-400">Settings</span></h2>
            <p className="text-sm text-slate-500 font-medium">Configure your license management system</p>
          </div>
        </div>
        <NeonButton onClick={handleSave} icon={Save}>Save Changes</NeonButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="text-cyan-400" size={20} />
            <h3 className="text-lg font-bold text-white">General Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Key Prefix</label>
              <input 
                type="text" 
                value={settings.defaultPrefix}
                onChange={(e) => setSettings({...settings, defaultPrefix: e.target.value.toUpperCase()})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" 
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Disable all key verifications</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Security Settings */}
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-purple-400" size={20} />
            <h3 className="text-lg font-bold text-white">Security & API</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Device Binding</p>
                <p className="text-xs text-slate-500">Enforce 1 key per device ID</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, requireDeviceBinding: !settings.requireDeviceBinding})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.requireDeviceBinding ? 'bg-cyan-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.requireDeviceBinding ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Rate Limit (req/15m)</label>
              <input 
                type="number" 
                value={settings.apiRateLimit}
                onChange={(e) => setSettings({...settings, apiRateLimit: parseInt(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" 
              />
            </div>
          </div>
        </GlassCard>

        {/* Admin Profile */}
        <GlassCard className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white">Admin Profile</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xl font-black">
                  {(user.email?.[0] || 'A').toUpperCase()}
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-white">{user.displayName || 'Administrator'}</p>
                <p className="text-sm text-slate-500">{user.email || 'Anonymous Session'}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20">Super Admin</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notification Email</label>
                <input 
                  type="email" 
                  value={settings.notificationEmail}
                  onChange={(e) => setSettings({...settings, notificationEmail: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors" 
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="md:col-span-2 border-rose-500/20 bg-rose-500/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-rose-500" size={20} />
            <h3 className="text-lg font-bold text-rose-500">Danger Zone</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-white">Reset System Logs</p>
              <p className="text-xs text-slate-500">Permanently delete all activity logs. This cannot be undone.</p>
            </div>
            <button className="px-6 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold hover:bg-rose-500 hover:text-white transition-all">
              Reset Logs
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
