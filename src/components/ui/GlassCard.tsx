import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#0a0a0a]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${className}`}>
      {children}
    </div>
  );
};
