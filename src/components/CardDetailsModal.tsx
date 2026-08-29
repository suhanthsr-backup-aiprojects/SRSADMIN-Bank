import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  Check, 
  Copy, 
  Sliders, 
  Wifi, 
  Globe, 
  ShoppingCart,
  Building2,
  Calendar,
  AlertCircle,
  Download,
  IndianRupee,
  Zap
} from 'lucide-react';
import { Card, CardStatus } from '../types';
import { formatCurrency, maskCardNumber } from '../utils/bankUtils';
import { CardVisual } from './CardVisual';

interface CardDetailsModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (cardId: string, status: CardStatus) => void;
  onSimulateTransaction?: (card: Card, amount: number, merchant: string) => void;
  onOpenRazorpaySimulator?: (card?: Card) => void;
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdateStatus,
  onSimulateTransaction,
  onOpenRazorpaySimulator,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [txAmount, setTxAmount] = useState('2499');
  const [txMerchant, setTxMerchant] = useState('Amazon India / Swiggy');

  if (!isOpen || !card) return null;

  const copyCardNumber = () => {
    navigator.clipboard.writeText(card.cardNumber.replace(/\s+/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSimulatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (onSimulateTransaction) {
      onSimulateTransaction(card, amt, txMerchant || 'RuPay POS Transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#111C33] border-2 border-[#004B87]/30 dark:border-blue-900/50 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#004B87] dark:bg-[#07172C] p-5 text-white border-b-4 border-[#FFB800] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB800]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {card.cardNickname || `${card.type} Card Controls`}
              </h3>
              <p className="text-[11px] text-blue-200 font-mono">
                Card ID: {card.id.toUpperCase()} • Issued by SRSADMIN CBS Branch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Presentation & Quick Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-[340px]">
                <CardVisual card={card} showAdminBadge={true} interactiveFlip={true} />
              </div>
            </div>

            <div className="md:col-span-6 space-y-3 bg-[#F8FAFD] dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Card Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{card.cardNumber}</span>
                  <button
                    type="button"
                    onClick={copyCardNumber}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Copy full number"
                  >
                    {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cardholder Name:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase font-mono">{card.cardholderName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Valid Thru:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{card.expiryMonth}/{card.expiryYear}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Card Security CVV:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#004B87] dark:text-blue-400">
                    {showCvv ? card.cvv : '•••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="text-[10px] text-[#004B87] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {showCvv ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">ATM Security PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {showPin ? card.pin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-[#004B87] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {showPin ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(card.id, card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE')}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    card.status === 'ACTIVE'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                  }`}
                >
                  {card.status === 'ACTIVE' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                      <span>Freeze Card (Block Transactions)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                      <span>Unfreeze Card (Restore Active)</span>
                    </>
                  )}
                </button>

                {onOpenRazorpaySimulator && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRazorpaySimulator(card);
                    }}
                    className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Launch Razorpay 3D-Secure Test</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Simulation Test Bar */}
          <div className="bg-[#FFFDF5] dark:bg-slate-800/80 border border-[#FFE08A] dark:border-amber-700/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#003B6F] dark:text-amber-300 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#FFB800]" />
                Simulate RuPay Merchant Transaction / POS Swipe
              </span>
              <span className="text-[10px] bg-[#FFB800] text-[#003B6F] font-bold px-2 py-0.5 rounded">
                NPCI Gateway
              </span>
            </div>

            <form onSubmit={handleSimulatePurchase} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Merchant / Narration</label>
                <input
                  type="text"
                  value={txMerchant}
                  onChange={(e) => setTxMerchant(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#004B87] dark:text-blue-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={card.status !== 'ACTIVE'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    card.status === 'ACTIVE'
                      ? 'bg-[#004B87] hover:bg-[#003B6F] text-white shadow-sm'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Swipe Card (₹{txAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
