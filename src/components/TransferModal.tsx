import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  CheckCircle2, 
  Building2, 
  Send,
  CreditCard,
  Zap,
  Smartphone,
  Landmark,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { UserAccount, Card, Transaction } from '../types';
import { formatCurrency, generateCanaraUtrNumber } from '../utils/bankUtils';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  userCards: Card[];
  onExecuteTransfer: (newTx: Transaction, updatedBalance: number) => void;
  preselectedCardId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  userCards,
  onExecuteTransfer,
  preselectedCardId,
}) => {
  const [transferMode, setTransferMode] = useState<'IMPS' | 'NEFT' | 'RTGS' | 'UPI'>('IMPS');
  const [recipientType, setRecipientType] = useState<'CANARA_INTERNAL' | 'OTHER_BANK' | 'UPI_VPA'>('CANARA_INTERNAL');
  
  const [targetUserId, setTargetUserId] = useState(
    allUsers.find((u) => u.id !== currentUser.id)?.id || ''
  );
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState('SBIN0001234');
  const [upiVpa, setUpiVpa] = useState('');
  const [amount, setAmount] = useState('10000');
  const [remarks, setRemarks] = useState('SRSADMIN IMPS Transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetUser = allUsers.find((u) => u.id === targetUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid transfer amount');
      return;
    }

    if (transferAmount > currentUser.balance) {
      setError(`Insufficient available balance in your SRSADMIN account (${formatCurrency(currentUser.balance)} available)`);
      return;
    }

    setIsProcessing(true);

    const utrNo = generateCanaraUtrNumber(transferMode);
    let narration = 'Interbank Funds Transfer';

    if (recipientType === 'CANARA_INTERNAL' && targetUser) {
      narration = `SRSADMIN Intrabank to ${targetUser.name} (A/c: ••••${targetUser.accountNumber.slice(-4)})`;
    } else if (recipientType === 'UPI_VPA') {
      narration = `UPI Pay to ${upiVpa || 'merchant@upi'}`;
    } else {
      narration = `${transferMode} to ${beneficiaryName || 'Beneficiary'} (IFSC: ${beneficiaryIfsc})`;
    }

    const newTx: Transaction = {
      id: `tx_${Date.now().toString(36)}_tr`,
      accountId: currentUser.id,
      accountNumber: currentUser.accountNumber,
      amount: transferAmount,
      type: 'DEBIT',
      category: 'TRANSFER',
      mode: transferMode,
      merchantName: narration,
      merchantCategory: 'National Payments Network',
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      referenceNumber: utrNo,
      notes: remarks || 'Online Banking Transfer',
    };

    setTimeout(() => {
      setIsProcessing(false);
      onExecuteTransfer(newTx, currentUser.balance - transferAmount);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-[#004B87]/30 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2.5 py-0.5 rounded">
                  SRSADMIN REMITTANCE
                </span>
                <span className="text-xs text-blue-200 font-mono">24x7 RTGS/NEFT/IMPS</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Send Money & Fund Transfer
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Mode Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Channel</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { mode: 'IMPS', label: 'IMPS 24x7', desc: 'Instant' },
                { mode: 'NEFT', label: 'NEFT', desc: 'Batch' },
                { mode: 'RTGS', label: 'RTGS', desc: '> ₹2 Lakh' },
                { mode: 'UPI', label: 'UPI Fast', desc: 'VPA' },
              ].map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => setTransferMode(m.mode as any)}
                  className={`p-2 rounded-xl text-center transition-all ${
                    transferMode === m.mode
                      ? 'bg-[#004B87] text-white shadow-md font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'
                  }`}
                >
                  <span className="block text-xs">{m.label}</span>
                  <span className={`block text-[9px] ${transferMode === m.mode ? 'text-amber-300' : 'text-slate-500'}`}>
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Beneficiary Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipientType('CANARA_INTERNAL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipientType === 'CANARA_INTERNAL'
                    ? 'bg-[#004B87] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                SRSADMIN Beneficiary
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('OTHER_BANK')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipientType === 'OTHER_BANK'
                    ? 'bg-[#004B87] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Other Bank (NEFT/IFSC)
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('UPI_VPA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipientType === 'UPI_VPA'
                    ? 'bg-[#004B87] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                UPI ID (VPA)
              </button>
            </div>
          </div>

          {/* Beneficiary Details */}
          {recipientType === 'CANARA_INTERNAL' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select SRSADMIN Account Holder
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
              >
                {allUsers.filter(u => u.id !== currentUser.id).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (A/c: {u.accountNumber} | CIF: {u.cifNumber || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {recipientType === 'OTHER_BANK' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Singhania"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50100293849182"
                    value={beneficiaryAccount}
                    onChange={(e) => setBeneficiaryAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#004B87]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN0001234"
                    value={beneficiaryIfsc}
                    onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#004B87]"
                  />
                </div>
              </div>
            </div>
          )}

          {recipientType === 'UPI_VPA' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Virtual Payment Address (UPI ID)</label>
              <input
                type="text"
                required
                placeholder="e.g. merchant@okhdfcbank or 9845012345@paytm"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold text-[#004B87] focus:outline-none focus:border-[#004B87]"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Transfer Amount (₹ INR) <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Available Bal: {formatCurrency(currentUser.balance)}
              </span>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-base font-mono font-black text-[#004B87] focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Payment Narration</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#004B87]"
            />
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
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#003B6F]"
            >
              {isProcessing ? (
                <span>Dispatching through NPCI / RBI...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FFB800]" />
                  <span>Authorize & Transfer Funds</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
