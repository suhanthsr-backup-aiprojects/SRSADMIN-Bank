import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sliders, 
  ShieldCheck, 
  Building2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  User, 
  RefreshCw, 
  TrendingUp,
  Landmark,
  IndianRupee
} from 'lucide-react';
import { UserAccount, AdminUser, Transaction, AuditLog } from '../types';
import { formatCurrency, generateCanaraUtrNumber } from '../utils/bankUtils';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  selectedUser?: UserAccount | null;
  currentAdmin: AdminUser;
  onBalanceAdjusted: (
    userId: string, 
    newBalance: number, 
    transaction: Transaction, 
    auditLog: AuditLog
  ) => void;
}

export const BalanceAdjustmentModal: React.FC<BalanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  users,
  selectedUser,
  currentAdmin,
  onBalanceAdjusted,
}) => {
  const [targetUserId, setTargetUserId] = useState<string>(selectedUser?.id || users[0]?.id || '');
  const [adjustmentType, setAdjustmentType] = useState<'CREDIT' | 'DEBIT' | 'OVERRIDE'>('CREDIT');
  const [amount, setAmount] = useState<string>('50000');
  const [overrideBalance, setOverrideBalance] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('BRANCH_CASH_DEPOSIT');
  const [notes, setNotes] = useState<string>('Cash deposit accepted at Branch Cash Counter');
  const [referenceCode, setReferenceCode] = useState<string>(generateCanaraUtrNumber('IMPS'));

  if (!isOpen) return null;

  const currentTargetUser = users.find((u) => u.id === targetUserId) || selectedUser || users[0];
  const currentBal = currentTargetUser ? currentTargetUser.balance : 0;
  const numAmount = parseFloat(amount) || 0;

  // Calculate resulting balance
  let projectedBalance = currentBal;
  if (adjustmentType === 'CREDIT') {
    projectedBalance = currentBal + numAmount;
  } else if (adjustmentType === 'DEBIT') {
    projectedBalance = Math.max(0, currentBal - numAmount);
  } else if (adjustmentType === 'OVERRIDE') {
    projectedBalance = parseFloat(overrideBalance) || 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTargetUser) return;

    let deltaAmount = 0;
    let txType: 'CREDIT' | 'DEBIT' = 'CREDIT';

    if (adjustmentType === 'CREDIT') {
      deltaAmount = numAmount;
      txType = 'CREDIT';
    } else if (adjustmentType === 'DEBIT') {
      deltaAmount = numAmount;
      txType = 'DEBIT';
    } else {
      const targetBal = parseFloat(overrideBalance) || 0;
      deltaAmount = Math.abs(targetBal - currentBal);
      txType = targetBal >= currentBal ? 'CREDIT' : 'DEBIT';
    }

    const timestamp = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const transaction: Transaction = {
      id: `tx_${Date.now().toString(36)}_cbs`,
      accountId: currentTargetUser.id,
      accountNumber: currentTargetUser.accountNumber,
      amount: deltaAmount,
      type: txType,
      category: 'ADMIN_BALANCE_ADJUSTMENT',
      mode: 'CBS_CLEARING',
      merchantName: `SRSADMIN Branch Ops (${currentAdmin.name.split(' ')[0]}) - ${notes}`,
      merchantCategory: reasonCategory.replace(/_/g, ' '),
      status: 'COMPLETED',
      timestamp: timestamp,
      referenceNumber: referenceCode,
    };

    const auditLog: AuditLog = {
      id: `audit_${Date.now().toString(36)}`,
      timestamp: timestamp,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'BALANCE_ADJUSTMENT',
      targetId: currentTargetUser.id,
      targetType: 'USER',
      details: `${adjustmentType} ₹${deltaAmount.toLocaleString('en-IN')} for ${currentTargetUser.name} (A/c: ${currentTargetUser.accountNumber}). Reason: ${reasonCategory}. Notes: ${notes}. UTR: ${referenceCode}`,
      severity: 'INFO',
      ipAddress: '10.24.112.4',
    };

    onBalanceAdjusted(currentTargetUser.id, projectedBalance, transaction, auditLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-[#004B87]/30 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  CBS FORM B-03
                </span>
                <span className="text-xs text-blue-200 font-mono">Officer: {currentAdmin.employeeId}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                SRSADMIN CBS Balance Adjustment / Deposit
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {/* Target Customer Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Customer Account <span className="text-rose-600">*</span>
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} (A/c: {u.accountNumber} | CIF: {u.cifNumber || 'N/A'}) - Current Bal: {formatCurrency(u.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Mode Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Operation Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('CREDIT')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  adjustmentType === 'CREDIT'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Deposit / Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('DEBIT')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  adjustmentType === 'DEBIT'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdrawal / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('OVERRIDE')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  adjustmentType === 'OVERRIDE'
                    ? 'bg-[#004B87] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Direct Balance Set</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          {adjustmentType !== 'OVERRIDE' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adjustmentType === 'CREDIT' ? 'Credit Amount (₹ INR)' : 'Debit Amount (₹ INR)'} <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-base font-mono font-black text-[#004B87] focus:outline-none focus:border-[#004B87]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Target Balance (₹ INR) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                placeholder={currentBal.toString()}
                value={overrideBalance}
                onChange={(e) => setOverrideBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-base font-mono font-black text-[#004B87] focus:outline-none focus:border-[#004B87]"
              />
            </div>
          )}

          {/* Reason & Narration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CBS Narration Category</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="BRANCH_CASH_DEPOSIT">Branch Cash Counter Deposit</option>
                <option value="INTEREST_CREDIT_Q4">Quarterly SB Interest Credit</option>
                <option value="NEFT_INWARD_SETTLEMENT">NEFT Inward Settlement (RBI)</option>
                <option value="SALARY_BULK_CREDIT">Corporate Bulk Salary Credit</option>
                <option value="DIVIDEND_CREDIT">Direct Equity Dividend Inflow</option>
                <option value="CHARGES_REVERSAL">Branch Fee / Penalty Reversal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Generated UTR Number</label>
              <input
                type="text"
                readOnly
                value={referenceCode}
                className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-bold text-[#004B87]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Officer Remarks / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#004B87]"
            />
          </div>

          {/* Calculation Preview */}
          <div className="bg-[#FFFDF5] border border-[#FFE08A] rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Current Ledger Balance:</span>
              <span className="font-mono font-bold text-slate-700">{formatCurrency(currentBal)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Updated Balance After Post:</span>
              <span className="font-mono font-black text-base text-emerald-700">
                {formatCurrency(projectedBalance)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#003B6F]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
              <span>Post to SRSADMIN Core Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
