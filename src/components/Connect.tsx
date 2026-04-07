import React from 'react';
import { 
  Smartphone, Code, Terminal, 
  Copy, CheckCircle2, Zap, 
  Globe, Shield, Activity 
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { NeonButton } from './ui/NeonButton';

interface ConnectProps {
  onCopy: (text: string) => void;
}

export const Connect: React.FC<ConnectProps> = ({ onCopy }) => {
  const apiUrl = `${window.location.origin}/api/verify-key`;

  const curlExample = `curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "ROHIT-XXXX-XXXX",
    "deviceId": "USER_DEVICE_ID"
  }'`;

  const jsonExample = `{
  "status": "valid",
  "message": "Key verified successfully",
  "data": {
    "key": "ROHIT-XXXX-XXXX",
    "appName": "My Premium App",
    "expiry": "2026-12-31T23:59:59Z"
  }
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Smartphone size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Connect <span className="text-cyan-400">App</span></h2>
          <p className="text-sm text-slate-500 font-medium">Integrate your software with the license system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Documentation */}
        <div className="space-y-6">
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="text-cyan-400" size={20} />
              <h3 className="text-lg font-bold text-white">Verification API</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endpoint URL</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <code className="text-xs text-cyan-400 flex-1 truncate">{apiUrl}</code>
                  <button onClick={() => onCopy(apiUrl)} className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HTTP Method</label>
                <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black border border-emerald-500/20">POST</div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Request Headers</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <code className="text-xs text-slate-400">Content-Type: application/json</code>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-purple-400" size={20} />
              <h3 className="text-lg font-bold text-white">Security Features</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Rate Limiting', desc: '100 req / 15 mins', icon: Activity },
                { label: 'Device Binding', desc: '1 Key = 1 Device', icon: Smartphone },
                { label: 'IP Logging', desc: 'Track every request', icon: Globe },
                { label: 'Real-time', desc: 'Instant status updates', icon: Zap },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                  <f.icon className="text-slate-500 mb-2" size={16} />
                  <p className="text-xs font-black text-white uppercase tracking-tighter">{f.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Code Examples */}
        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Terminal className="text-emerald-400" size={20} />
                <h3 className="text-lg font-bold text-white">cURL Example</h3>
              </div>
              <button onClick={() => onCopy(curlExample)} className="p-2 text-slate-500 hover:text-emerald-400 transition-colors">
                <Copy size={16} />
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Code className="text-amber-400" size={20} />
                <h3 className="text-lg font-bold text-white">Response Format</h3>
              </div>
              <button onClick={() => onCopy(jsonExample)} className="p-2 text-slate-500 hover:text-amber-400 transition-colors">
                <Copy size={16} />
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-amber-400/80 overflow-x-auto leading-relaxed">
              {jsonExample}
            </pre>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
