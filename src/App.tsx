import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  LogOut, 
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  deleteDoc, 
  doc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KeyManager } from './components/KeyManager';
import { Logs } from './components/Logs';
import { Settings } from './components/Settings';
import { Connect } from './components/Connect';
import { GlassCard } from './components/ui/GlassCard';
import { NeonButton } from './components/ui/NeonButton';

// Types
interface LicenseKey {
  id: string;
  key: string;
  status: 'active' | 'expired' | 'paused' | 'disabled';
  expiryType: string;
  expiryDate: Timestamp | 'lifetime';
  note?: string;
  appName?: string;
  appLink?: string;
  deviceId?: string;
  createdAt: Timestamp;
  createdBy: string;
}

interface ActivityLog {
  id: string;
  type: string;
  details: string;
  timestamp: Timestamp;
  adminId: string;
  ip?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const keysQuery = query(collection(db, 'keys'), orderBy('createdAt', 'desc'));
    const unsubscribeKeys = onSnapshot(keysQuery, (snapshot) => {
      const keysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LicenseKey));
      setKeys(keysData);
    });

    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setLogs(logsData);
    });

    return () => {
      unsubscribeKeys();
      unsubscribeLogs();
    };
  }, [user]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login failed. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const generateRandomKey = (prefix: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${segment()}-${segment()}`;
  };

  const calculateExpiry = (type: string, customDate?: string) => {
    if (type === 'lifetime') return 'lifetime';
    const date = new Date();
    if (type === '1day') date.setDate(date.getDate() + 1);
    else if (type === '7days') date.setDate(date.getDate() + 7);
    else if (type === 'custom' && customDate) return Timestamp.fromDate(new Date(customDate));
    return Timestamp.fromDate(date);
  };

  const handleGenerateKey = async (data: any) => {
    if (!user) return;
    const newKey = generateRandomKey(data.prefix || 'ROHIT');
    const expiry = calculateExpiry(data.expiryType, data.customDate);

    try {
      await addDoc(collection(db, 'keys'), {
        key: newKey,
        status: 'active',
        expiryType: data.expiryType,
        expiryDate: expiry,
        note: data.note || '',
        appName: data.appName || '',
        createdAt: Timestamp.now(),
        createdBy: user.uid
      });

      await addDoc(collection(db, 'logs'), {
        type: 'key_generated',
        details: `Generated key: ${newKey} for app: ${data.appName || 'N/A'}`,
        timestamp: Timestamp.now(),
        adminId: user.uid
      });

      showNotification('Key generated successfully!');
    } catch (error) {
      console.error('Error generating key:', error);
      showNotification('Failed to generate key.', 'error');
    }
  };

  const handleBulkGenerate = async (data: any, count: number) => {
    if (!user) return;
    const batch = writeBatch(db);
    const expiry = calculateExpiry(data.expiryType, data.customDate);
    const generatedKeys = [];

    try {
      for (let i = 0; i < count; i++) {
        const newKey = generateRandomKey(data.prefix || 'ROHIT');
        const keyRef = doc(collection(db, 'keys'));
        batch.set(keyRef, {
          key: newKey,
          status: 'active',
          expiryType: data.expiryType,
          expiryDate: expiry,
          note: data.note || '',
          appName: data.appName || '',
          createdAt: Timestamp.now(),
          createdBy: user.uid
        });
        generatedKeys.push(newKey);
      }

      await batch.commit();

      await addDoc(collection(db, 'logs'), {
        type: 'key_generated',
        details: `Bulk generated ${count} keys for app: ${data.appName || 'N/A'}`,
        timestamp: Timestamp.now(),
        adminId: user.uid
      });

      showNotification(`Successfully generated ${count} keys!`);
    } catch (error) {
      console.error('Bulk generation error:', error);
      showNotification('Failed to generate bulk keys.', 'error');
    }
  };

  const handleToggleStatus = async (key: LicenseKey) => {
    const newStatus = key.status === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'keys', key.id), { status: newStatus });
      await addDoc(collection(db, 'logs'), {
        type: 'key_status_change',
        details: `Key ${key.key} status changed to ${newStatus}`,
        timestamp: Timestamp.now(),
        adminId: user?.uid || 'system'
      });
      showNotification(`Key ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`);
    } catch (error) {
      console.error('Error toggling status:', error);
      showNotification('Failed to update key status.', 'error');
    }
  };

  const handleDeleteKey = async (key: LicenseKey) => {
    try {
      await deleteDoc(doc(db, 'keys', key.id));
      await addDoc(collection(db, 'logs'), {
        type: 'key_deleted',
        details: `Deleted key: ${key.key}`,
        timestamp: Timestamp.now(),
        adminId: user?.uid || 'system'
      });
      showNotification('Key deleted successfully.');
    } catch (error) {
      console.error('Error deleting key:', error);
      showNotification('Failed to delete key.', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!');
  };

  const handleClearLogs = async () => {
    if (!user) return;
    // For safety, we only delete logs older than 30 days or just clear all if requested
    // Here we'll just clear all for simplicity as requested by "Reset Logs"
    const batch = writeBatch(db);
    logs.forEach(log => {
      batch.delete(doc(db, 'logs', log.id));
    });
    try {
      await batch.commit();
      showNotification('All logs cleared successfully.');
    } catch (error) {
      console.error('Error clearing logs:', error);
      showNotification('Failed to clear logs.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="text-cyan-400 animate-pulse" size={20} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <GlassCard className="text-center space-y-8 border-cyan-500/20">
            <div className="space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <Zap size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                ROHIT X <span className="text-cyan-400">ANKIT</span>
              </h1>
              <p className="text-slate-500 font-medium">License Key Management System</p>
            </div>

            <div className="space-y-4">
              <NeonButton onClick={handleLogin} className="w-full py-4 text-lg" icon={Zap}>
                Admin Login
              </NeonButton>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Authorized Personnel Only</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 flex font-sans selection:bg-cyan-500/30">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300 ease-in-out min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-cyan-400 transition-all border border-slate-800"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-white tracking-tight uppercase hidden sm:block">
              {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard keys={keys} logs={logs} />}
              {activeTab === 'keys' && (
                <KeyManager 
                  keys={keys} 
                  onGenerate={handleGenerateKey} 
                  onBulkGenerate={handleBulkGenerate}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteKey}
                  onCopy={handleCopy}
                />
              )}
              {activeTab === 'logs' && <Logs logs={logs} onClearLogs={handleClearLogs} />}
              {activeTab === 'connect' && <Connect onCopy={handleCopy} />}
              {activeTab === 'settings' && <Settings user={user} onUpdateSettings={(s) => showNotification('Settings updated!')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${
              notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
