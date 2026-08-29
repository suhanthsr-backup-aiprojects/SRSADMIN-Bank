import React, { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import shristiAvatar from '../assets/images/shristi_mascot_1787969749809.jpg';

interface ShristiFloatingMascotProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const ShristiFloatingMascot: React.FC<ShristiFloatingMascotProps> = ({
  onClick,
  isOpen = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-end gap-2.5 select-none">
      {/* Interactive Speech Hint Bubble */}
      <div 
        onClick={onClick}
        className={`hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-amber-200/80 text-xs text-slate-800 cursor-pointer transition-all duration-300 transform ${
          isHovered ? 'scale-105 shadow-xl border-amber-400' : 'opacity-90 hover:opacity-100'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-semibold text-slate-700">
          Hi! Ask <strong className="text-[#004B87] font-black">Shristi</strong>
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
      </div>

      {/* Main Mascot Avatar Button */}
      <button
        type="button"
        id="floating-shristi-mascot-btn"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-[#004B87] via-[#003866] to-[#002244] shadow-2xl hover:shadow-amber-500/20 ring-4 ring-white transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Open Shristi AI Banking Assistant"
      >
        {/* Glow Ring */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-blue-500 opacity-40 group-hover:opacity-75 blur-xs transition-opacity duration-300 animate-pulse" />

        {/* Mascot Avatar Container */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden ring-2 ring-amber-400/90 shadow-inner">
          <img
            src={shristiAvatar}
            alt="Shristi AI Mascot"
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Online Status / AI Indicator Badge */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-white items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        </span>

        {/* Mini Label for Mobile */}
        <span className="sm:hidden absolute -bottom-2 bg-[#004B87] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-300 shadow-xs">
          AI
        </span>
      </button>
    </div>
  );
};
