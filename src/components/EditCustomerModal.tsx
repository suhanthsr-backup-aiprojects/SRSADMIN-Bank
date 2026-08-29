import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  KeyRound, 
  Sliders,
  Landmark
} from 'lucide-react';
import { UserAccount, AdminUser, AuditLog } from '../types';
import { formatCurrency } from '../utils/bankUtils';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  currentAdmin: AdminUser;
  onUpdateUser: (updatedUser: UserAccount, auditLog: AuditLog) => void;
  onDeleteUser?: (userId: string, auditLog: AuditLog) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  user,
  currentAdmin,
  onUpdateUser,
  onDeleteUser,
}) => {
  if (!isOpen || !user) return null;

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address);
  const [accountType, setAccountType] = useState(user.accountType);
  const [kycStatus, setKycStatus] = useState(user.kycStatus);
  const [accountStatus, setAccountStatus] = useState(user.accountStatus || 'ACTIVE');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserAccount = {
      ...user,
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      accountType,
      kycStatus,
      accountStatus,
      password: newPassword.trim() ? newPassword.trim() : user.password,
    };

    const timestamp = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    const log: AuditLog = {
      id: `log_${Date.now().toString(36)}_cust_mod`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'CUSTOMER_PROFILE_UPDATED',
      targetType: 'USER',
      targetId: user.id,
      details: `Updated SRSADMIN CBS master profile for ${user.name} (A/c: ${user.accountNumber}, CIF: ${user.cifNumber}). Status: ${accountStatus}, KYC: ${kycStatus}.${newPassword ? ' NetBanking credentials reset.' : ''}`,
      timestamp,
      severity: accountStatus === 'FROZEN' ? 'WARNING' : 'INFO',
    };

    onUpdateUser(updated, log);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border-2 border-[#004B87]/30 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#004B87] p-5 text-white border-b-4 border-[#FFB800] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB800]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  CBS CIF MODIFICATION
                </span>
                <span className="text-xs text-blue-200 font-mono">CIF: {user.cifNumber || '84920194821'}</span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-0.5">
                Edit Customer Account Profile ({user.name})
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NetBanking User ID</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (+91)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#004B87]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Scheme Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="SAVINGS">SRSADMIN SB General (Savings)</option>
                <option value="CHECKING">SRSADMIN Premium SB</option>
                <option value="CORPORATE_CURRENT">SRSADMIN Current A/c (Business)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Operation Status</label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value as any)}
                className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ACTIVE">ACTIVE (Normal Operations)</option>
                <option value="FROZEN">FROZEN (Debit Freeze)</option>
                <option value="SUSPENDED">SUSPENDED (Total Freeze)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Communication Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reset NetBanking Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave blank to keep existing password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#004B87]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#003B6F]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
              <span>Update CBS Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
