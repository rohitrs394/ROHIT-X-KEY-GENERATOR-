import { useState, useEffect } from 'react';
import { 
  loginWithGoogle, 
  logout, 
  auth, 
  db, 
  LicenseKey, 
  ActivityLog, 
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  deleteDoc,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Key, 
  History, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Pause, 
  Play, 
  Clock, 
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Menu,
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';

// --- Components ---

const NeonButton = ({ children, onClick, variant = 'primary', className = '', icon: Icon }: any) => {
  const variants: any = {
    primary: 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    danger: 'bg-rose-500/10 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    ghost: 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all duration-300 active:scale-95 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const GlassCard = ({ children, className = '' }: any) => (
  <div className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <GlassCard className="flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </GlassCard>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    prefix: 'NEON',
    expiryType: '1day',
    customDate: '',
    note: '',
    appName: '',
    appLink: '',
    bindDevice: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to Keys
    const keysQuery = query(collection(db, 'keys'), orderBy('createdAt', 'desc'));
    const unsubscribeKeys = onSnapshot(keysQuery, (snapshot) => {
      const k = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LicenseKey));
      setKeys(k);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'keys'));

    // Listen to Logs
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const l = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setLogs(l);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'logs'));

    return () => {
      unsubscribeKeys();
      unsubscribeLogs();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Welcome back, Admin');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const generateKey = async () => {
    if (!user) return;
    
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullKey = `${newKeyData.prefix}-${randomPart}`;
    
    let expiryDate: any = null;
    const now = new Date();
    if (newKeyData.expiryType === '1day') {
      expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (newKeyData.expiryType === '7days') {
      expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (newKeyData.expiryType === 'custom') {
      expiryDate = new Date(newKeyData.customDate);
    }

    const keyPayload: LicenseKey = {
      key: fullKey,
      status: 'active',
      expiryType: newKeyData.expiryType as any,
      expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : 'lifetime',
      note: newKeyData.note,
      appName: newKeyData.appName,
      appLink: newKeyData.appLink,
      createdAt: Timestamp.now(),
      createdBy: user.uid
    };

    try {
      await addDoc(collection(db, 'keys'), keyPayload);
      await addDoc(collection(db, 'logs'), {
        type: 'key_generated',
        details: `Generated key: ${fullKey}`,
        timestamp: serverTimestamp(),
        adminId: user.uid
      });
      setIsAddModalOpen(false);
      toast.success('Key generated successfully');
    } catch (error) {
      toast.error('Failed to generate key');
    }
  };

  const [keyToDelete, setKeyToDelete] = useState<LicenseKey | null>(null);

  const toggleKeyStatus = async (key: LicenseKey) => {
    const newStatus = key.status === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'keys', key.id!), { status: newStatus });
      await addDoc(collection(db, 'logs'), {
        type: 'key_updated',
        details: `Updated key status: ${key.key} to ${newStatus}`,
        timestamp: serverTimestamp(),
        adminId: user?.uid
      });
      toast.success(`Key ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const deleteKey = async (key: LicenseKey) => {
    try {
      await deleteDoc(doc(db, 'keys', key.id!));
      await addDoc(collection(db, 'logs'), {
        type: 'key_deleted',
        details: `Deleted key: ${key.key}`,
        timestamp: serverTimestamp(),
        adminId: user?.uid
      });
      toast.success('Key deleted');
      setKeyToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <GlassCard className="text-center space-y-8 border-cyan-500/30">
            <div className="space-y-2">
              <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                <ShieldCheck size={48} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">
                ROHIT X <span className="text-cyan-400">ANKIT</span>
              </h1>
              <p className="text-slate-400 font-medium">Secure Key Management System</p>
            </div>
            
            <div className="space-y-4">
              <NeonButton onClick={handleLogin} className="w-full py-4 text-lg" icon={Zap}>
                Admin Login
              </NeonButton>
              <p className="text-xs text-slate-500">Authorized Personnel Only</p>
            </div>
          </GlassCard>
        </motion.div>
        <Toaster theme="dark" position="top-center" />
      </div>
    );
  }

  const filteredKeys = keys.filter(k => 
    k.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
    k.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.appName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.status === 'active').length,
    expired: keys.filter(k => k.status === 'expired').length,
    paused: keys.filter(k => k.status === 'paused' || k.status === 'disabled').length
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex font-sans selection:bg-cyan-500/30">
      <Toaster theme="dark" richColors position="top-right" />
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[100] w-72 bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.9)]' : '-translate-x-full invisible'}`}
        style={{ display: isSidebarOpen ? 'block' : 'none' }}
      >
        <div className="p-6 flex flex-col h-full relative">
          {/* Close Button - Absolute positioned for guaranteed visibility */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="absolute top-4 right-4 p-3 rounded-2xl bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:scale-110 active:scale-95 transition-all z-[110]"
            aria-label="Close sidebar"
          >
            <X size={28} strokeWidth={3} />
          </button>

          <div className="flex items-center gap-3 mb-10 pr-10">
            <div className="p-2 rounded-lg bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              <Zap size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">ROHIT X <span className="text-cyan-400">ANKIT</span></span>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'keys', label: 'Key Manager', icon: Key },
              { id: 'logs', label: 'Activity Logs', icon: History },
              { id: 'connect', label: 'Connect App', icon: Smartphone },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.displayName || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className={`p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-all ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-white capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search keys..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors w-64"
              />
            </div>
            <NeonButton onClick={() => setIsAddModalOpen(true)} icon={Plus}>
              New Key
            </NeonButton>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Keys" value={stats.total} icon={Key} color="cyan" />
                <StatCard label="Active Keys" value={stats.active} icon={CheckCircle2} color="emerald" />
                <StatCard label="Expired" value={stats.expired} icon={Clock} color="rose" />
                <StatCard label="Paused" value={stats.paused} icon={Pause} color="amber" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Keys */}
                <GlassCard className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Keys</h3>
                    <button onClick={() => setActiveTab('keys')} className="text-cyan-400 text-sm hover:underline">View all</button>
                  </div>
                  <div className="space-y-4">
                    {keys.slice(0, 5).map((k) => (
                      <div key={k.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 group hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${k.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
                          <div>
                            <p className="font-mono text-white group-hover:text-cyan-400 transition-colors">{k.key}</p>
                            <p className="text-xs text-slate-500">{k.appName || 'No App Linked'} • {k.expiryType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(k.key)} className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {keys.length === 0 && <p className="text-center py-8 text-slate-500">No keys generated yet.</p>}
                  </div>
                </GlassCard>

                {/* Recent Activity */}
                <GlassCard>
                  <h3 className="text-lg font-bold text-white mb-6">Activity Logs</h3>
                  <div className="space-y-6">
                    {logs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex gap-4">
                        <div className="relative">
                          <div className={`w-2 h-2 rounded-full mt-2 ${log.type === 'key_generated' ? 'bg-cyan-500' : log.type === 'key_verification' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                          <div className="absolute top-4 bottom-0 left-1 w-px bg-slate-800" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-slate-300 leading-tight">{log.details}</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                            {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, HH:mm') : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-center py-8 text-slate-500">No activity yet.</p>}
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'keys' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <h3 className="text-2xl font-bold text-white">License Keys</h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search keys..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <GlassCard className="overflow-hidden p-0 border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Key Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">App / Note</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredKeys.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-900/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-white font-medium">{k.key}</span>
                              <button onClick={() => copyToClipboard(k.key)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-all">
                                <Copy size={14} />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Created: {k.createdAt ? format(k.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              k.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-400' : k.status === 'paused' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                              {k.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300">{k.expiryType === 'lifetime' ? 'Lifetime' : k.expiryDate instanceof Timestamp ? format(k.expiryDate.toDate(), 'MMM d, yyyy') : 'N/A'}</p>
                            <p className="text-[10px] text-slate-500">{k.expiryType}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300 truncate max-w-[150px]">{k.appName || 'N/A'}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{k.note || '-'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => toggleKeyStatus(k)}
                                className={`p-2 rounded-lg transition-colors ${k.status === 'active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                title={k.status === 'active' ? 'Pause Key' : 'Activate Key'}
                              >
                                {k.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                              </button>
                              <button 
                                onClick={() => setKeyToDelete(k)}
                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No keys found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Activity History</h3>
              <GlassCard className="p-0 overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-900/20 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        log.type === 'key_generated' ? 'bg-cyan-500/10 text-cyan-400' :
                        log.type === 'key_deleted' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.type === 'key_generated' ? <Plus size={18} /> : 
                         log.type === 'key_deleted' ? <Trash2 size={18} /> : 
                         <History size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 font-medium">{log.details}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {log.timestamp ? format(log.timestamp.toDate(), 'MMM d, yyyy HH:mm:ss') : 'Just now'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ShieldCheck size={12} />
                            Admin ID: {log.adminId?.substring(0, 6)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="p-12 text-center text-slate-500">No logs recorded yet.</p>}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'connect' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Connect Your Application</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="space-y-6">
                  <div className="flex items-center gap-3 text-cyan-400">
                    <Smartphone size={24} />
                    <h4 className="text-lg font-bold">API Documentation</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Endpoint</p>
                      <code className="text-cyan-400 break-all">POST {window.location.origin}/api/verify-key</code>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Request Body (JSON)</p>
                      <pre className="text-slate-300 text-xs overflow-x-auto">
{`{
  "key": "ROHIT-XXXX-XXXX",
  "deviceId": "DEVICE_ID_HERE"
}`}
                      </pre>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Sample cURL</p>
                      <pre className="text-slate-300 text-xs overflow-x-auto">
{`curl -X POST ${window.location.origin}/api/verify-key \\
  -H "Content-Type: application/json" \\
  -d '{"key": "ROHIT-XXXX-XXXX"}'`}
                      </pre>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="space-y-6">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 size={24} />
                    <h4 className="text-lg font-bold">Integration Guide</h4>
                  </div>
                  <div className="space-y-4 text-sm text-slate-400">
                    <p>1. <span className="text-white">Generate a key</span> in the Key Manager tab.</p>
                    <p>2. <span className="text-white">Call the API</span> from your application using the endpoint provided.</p>
                    <p>3. <span className="text-white">Verify the response</span>. A successful verification will return <code className="text-emerald-400">"status": "valid"</code>.</p>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <p className="font-bold mb-1">Pro Tip:</p>
                      <p className="text-xs">Always use HTTPS for API calls to keep your keys secure during transmission.</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-8">
              <h3 className="text-2xl font-bold text-white">System Settings</h3>
              
              <GlassCard className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap size={20} className="text-cyan-400" />
                    API Configuration
                  </h4>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <p className="text-sm text-slate-400">Verification Endpoint:</p>
                    <div className="flex items-center justify-between bg-black p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-400">
                      <span>{window.location.origin}/api/verify-key</span>
                      <button onClick={() => copyToClipboard(`${window.location.origin}/api/verify-key`)} className="text-slate-500 hover:text-white">
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">Method: POST | Content-Type: application/json</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <h4 className="text-lg font-bold text-white">Admin Access</h4>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-white">{user.email}</p>
                      <p className="text-xs text-slate-500">Primary Administrator</p>
                    </div>
                    <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {keyToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setKeyToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm"
            >
              <GlassCard className="border-rose-500/30 text-center space-y-6">
                <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Key?</h3>
                  <p className="text-slate-400 mt-2">Are you sure you want to delete <span className="text-white font-mono">{keyToDelete.key}</span>? This action cannot be undone.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKeyToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteKey(keyToDelete)}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  >
                    Delete
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Key Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg"
            >
              <GlassCard className="border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white tracking-tight">GENERATE <span className="text-cyan-400">KEY</span></h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Prefix</label>
                      <input 
                        type="text" 
                        value={newKeyData.prefix}
                        onChange={(e) => setNewKeyData({...newKeyData, prefix: e.target.value.toUpperCase()})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="e.g. NEON"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Type</label>
                      <select 
                        value={newKeyData.expiryType}
                        onChange={(e) => setNewKeyData({...newKeyData, expiryType: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="1day">1 Day</option>
                        <option value="7days">7 Days</option>
                        <option value="custom">Custom Date</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                  </div>

                  {newKeyData.expiryType === 'custom' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Expiry Date</label>
                      <input 
                        type="datetime-local" 
                        value={newKeyData.customDate}
                        onChange={(e) => setNewKeyData({...newKeyData, customDate: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Name</label>
                    <input 
                      type="text" 
                      value={newKeyData.appName}
                      onChange={(e) => setNewKeyData({...newKeyData, appName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="e.g. CyberApp v1.0"
                    />
                    <p className="text-[10px] text-slate-500">Enter the name of the app this key is for.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Link (Optional)</label>
                    <input 
                      type="text" 
                      value={newKeyData.appLink}
                      onChange={(e) => setNewKeyData({...newKeyData, appLink: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="e.g. https://myapp.com"
                    />
                    <p className="text-[10px] text-slate-500">Add the URL where the user can download or use the app.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note / Tag</label>
                    <textarea 
                      value={newKeyData.note}
                      onChange={(e) => setNewKeyData({...newKeyData, note: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors h-24 resize-none"
                      placeholder="Add a private note..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <input 
                      type="checkbox" 
                      id="bindDevice"
                      checked={newKeyData.bindDevice}
                      onChange={(e) => setNewKeyData({...newKeyData, bindDevice: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <label htmlFor="bindDevice" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Smartphone size={16} className="text-slate-500" />
                      Bind with Device ID (Optional)
                    </label>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <NeonButton onClick={() => setIsAddModalOpen(false)} variant="ghost" className="flex-1">
                      Cancel
                    </NeonButton>
                    <NeonButton onClick={generateKey} className="flex-[2] py-4 text-lg" icon={Zap}>
                      Generate Now
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
