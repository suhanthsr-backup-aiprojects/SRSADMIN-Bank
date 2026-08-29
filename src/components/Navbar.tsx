import React from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  Clock,
  Shield,
  Landmark,
  Building2
} from 'lucide-react';
import { UserAccount, AdminUser } from '../types';
import { formatCurrency } from '../utils/bankUtils';
import { CanaraLogo } from './CanaraLogo';
import shristiAvatar from '../assets/images/shristi_mascot_1787969749809.jpg';

interface NavbarProps {
  currentView: 'USER' | 'ADMIN';
  currentUser: UserAccount;
  currentAdmin: AdminUser;
  onLogout: () => void;
  onOpenGemini?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentUser,
  currentAdmin,
  onLogout,
  onOpenGemini,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Thin Information Bar */}
      <div className="w-full bg-[#0B192C] text-slate-300 px-4 sm:px-6 py-1 text-[11px] flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-medium text-amber-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">RBI Scheduled Commercial Bank</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden md:inline font-mono">
            {currentView === 'USER' ? `IFSC: ${currentUser.ifscCode || 'SRSA0000001'}` : `Branch Desk: ${currentAdmin.branchCode || 'SRSA-001'}`}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
            <span>IST {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300 font-sans">
            Toll-Free: <strong className="text-white font-mono">1800 425 0018</strong>
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Portal Type */}
        <div className="flex items-center gap-3">
          <CanaraLogo size="md" showSubtitle={false} />
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border hidden sm:inline-flex items-center gap-1.5 ${
            currentView === 'USER'
              ? 'bg-blue-50/80 text-[#004B87] border-blue-200/80'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            {currentView === 'USER' ? (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Retail NetBanking</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5" />
                <span>Branch CBS Workstation</span>
              </>
            )}
          </span>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shristi AI Copilot Button with Mascot */}
          {onOpenGemini && (
            <button
              type="button"
              id="header-gemini-btn"
              onClick={onOpenGemini}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-blue-500/20 border border-amber-400/50 text-[#004B87] text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title="Open Shristi AI Banking Assistant"
            >
              <div className="relative">
                <img
                  src={shristiAvatar}
                  alt="Shristi Mascot"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
              </div>
              <span className="font-sans">
                <span className="hidden sm:inline">Ask </span>Shristi
              </span>
            </button>
          )}

          {/* User / Officer Profile Badge (No Demo Switchers) */}
          {currentView === 'USER' ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <div className="w-7 h-7 rounded-lg bg-[#004B87] text-white flex items-center justify-center font-bold text-xs font-mono">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-slate-900 leading-none truncate max-w-[120px]">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{formatCurrency(currentUser.balance)}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs font-mono">
                {currentAdmin.avatarInitials}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-slate-900 leading-none truncate max-w-[120px]">{currentAdmin.name}</div>
                <div className="text-[10px] text-amber-800 font-mono mt-0.5">{currentAdmin.employeeId}</div>
              </div>
            </div>
          )}

          {/* Secure Logout Button */}
          <button
            type="button"
            id="nav-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold"
            title="Sign Out to Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
