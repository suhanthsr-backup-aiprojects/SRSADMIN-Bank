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
  IndianRupee
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
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdateStatus,
  onSimulateTransaction,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSimulatingTx, setIsSimulatingTx] = useState(false);
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
      setIsSimulatingTx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border-2 border-[#004B87]/30 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#004B87] p-5 text-white border-b-4 border-[#FFB800] flex items-center justify-between shrink-0">
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
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
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

            <div className="md:col-span-6 space-y-3 bg-[#F8FAFD] p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Card Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{card.cardNumber}</span>
                  <button
                    type="button"
                    onClick={copyCardNumber}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="Copy full number"
                  >
                    {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Cardholder Name:</span>
                <span className="font-bold text-slate-900 uppercase font-mono">{card.cardholderName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Valid Thru:</span>
                <span className="font-mono font-bold text-slate-900">{card.expiryMonth}/{card.expiryYear}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Card Security CVV:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#004B87]">
                    {showCvv ? card.cvv : '•••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="text-[10px] text-[#004B87] hover:underline font-semibold"
                  >
                    {showCvv ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">ATM Security PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">
                    {showPin ? card.pin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-[#004B87] hover:underline font-semibold"
                  >
                    {showPin ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(card.id, card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE')}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    card.status === 'ACTIVE'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {card.status === 'ACTIVE' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Freeze Card (Block Transactions)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Unfreeze Card (Restore Active)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Simulation Test Bar */}
          <div className="bg-[#FFFDF5] border border-[#FFE08A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#003B6F] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#FFB800]" />
                Simulate RuPay Merchant Transaction / POS Swipe
              </span>
              <span className="text-[10px] bg-[#FFB800] text-[#003B6F] font-bold px-2 py-0.5 rounded">
                NPCI Gateway
              </span>
            </div>

            <form onSubmit={handleSimulatePurchase} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Merchant / Narration</label>
                <input
                  type="text"
                  value={txMerchant}
                  onChange={(e) => setTxMerchant(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-[#004B87]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={card.status !== 'ACTIVE'}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    card.status === 'ACTIVE'
                      ? 'bg-[#004B87] hover:bg-[#003B6F] text-white shadow-sm'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
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
