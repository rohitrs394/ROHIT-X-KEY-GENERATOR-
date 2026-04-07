import React from 'react';
import { 
  LayoutDashboard, Key, History, 
  Settings, Smartphone, LogOut, 
  X, Zap 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, user, onLogout 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'keys', label: 'Key Manager', icon: Key },
    { id: 'logs', label: 'Activity Logs', icon: History },
    { id: 'connect', label: 'Connect App', icon: Smartphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-[100] w-72 bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.9)]' : '-translate-x-full invisible'}`}
      style={{ display: isSidebarOpen ? 'block' : 'none' }}
    >
      <div className="p-6 flex flex-col h-full relative">
        {/* Close Button */}
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
          <span className="text-xl font-black tracking-tighter text-white uppercase">ROHIT X <span className="text-cyan-400">ANKIT</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
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
                {(user?.email?.[0] || 'A').toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'Anonymous Session'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
