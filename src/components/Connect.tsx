import React from 'react';
import { 
  Smartphone, Code, Terminal, 
  Copy, CheckCircle2, Zap, 
  Globe, Shield, Activity,
  AlertTriangle
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

  const serverlessExample = `// Import Firebase SDK
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

async function verifyKey(licenseKey, deviceId) {
  const db = getFirestore();
  const q = query(
    collection(db, 'keys'), 
    where('key', '==', licenseKey)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return { status: 'invalid' };
  
  const keyData = snapshot.docs[0].data();
  // Check status and expiry...
  return { status: keyData.status, data: keyData };
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

      {/* Server Status Warning */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4">
        <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={20} />
        <div>
          <p className="text-sm font-bold text-amber-500 uppercase tracking-tight">Backend Server Notice</p>
          <p className="text-xs text-slate-400 mt-1">The API Endpoint below requires a Node.js backend. If you are hosting on Netlify, use the <span className="text-cyan-400 font-bold">Serverless Method</span> instead.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Documentation */}
        <div className="space-y-6">
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="text-cyan-400" size={20} />
              <h3 className="text-lg font-bold text-white">API Endpoint (Server Required)</h3>
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
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Zap className="text-cyan-400" size={20} />
                <h3 className="text-lg font-bold text-white">Serverless Method (Netlify)</h3>
              </div>
              <button onClick={() => onCopy(serverlessExample)} className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Query Firestore directly from your client app. No server needed.</p>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-cyan-400/80 overflow-x-auto leading-relaxed">
              {serverlessExample}
            </pre>
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
