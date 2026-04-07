import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  disabled = false
}) => {
  const variants = {
    primary: 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    secondary: 'bg-purple-500/10 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-black shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    danger: 'bg-rose-500/10 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border font-bold 
        transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};
