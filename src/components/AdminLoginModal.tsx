import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  X, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  Landmark
} from 'lucide-react';
import { AdminUser } from '../types';
import { INITIAL_ADMINS } from '../data/initialData';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser>(INITIAL_ADMINS[0]);
  const [employeeId, setEmployeeId] = useState(INITIAL_ADMINS[0].employeeId);
  const [securityPin, setSecurityPin] = useState('9041');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEmployeeId(admin.employeeId);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }
    if (securityPin.length < 4) {
      setError('Security PIN must be at least 4 digits');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(selectedAdmin);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border-2 border-[#004B87]/30 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-[#004B87] p-5 text-white border-b-4 border-[#FFB800] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB800]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                SRSADMIN CBS Security Desk
              </h2>
              <p className="text-[11px] text-blue-200 font-mono">
                Branch Card Issuance & Clearing Terminal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Officer Preset Selection */}
        <div className="p-4 bg-[#F0F6FC] border-b border-[#CCE0F2]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#004B87] block mb-2">
            Select Branch Officer Profile (1-Click Switch)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INITIAL_ADMINS.map((adm) => (
              <button
                key={adm.id}
                type="button"
                onClick={() => handleSelectPreset(adm)}
                className={`p-2 rounded-xl text-left transition-all border ${
                  selectedAdmin.id === adm.id
                    ? 'bg-[#004B87] text-white border-[#003B6F] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#004B87]'
                }`}
              >
                <span className="font-bold text-xs block truncate">{adm.name.split(' ')[0]}</span>
                <span className={`text-[9px] font-mono block ${selectedAdmin.id === adm.id ? 'text-amber-300' : 'text-slate-500'}`}>
                  {adm.employeeId.slice(-6)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Officer Employee ID
            </label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Branch Security PIN
            </label>
            <input
              type="password"
              required
              maxLength={6}
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-[#003B6F]"
          >
            <Lock className="w-4 h-4 text-[#FFB800]" />
            <span>Authorize Branch CBS Session</span>
          </button>
        </form>
      </div>
    </div>
  );
};
