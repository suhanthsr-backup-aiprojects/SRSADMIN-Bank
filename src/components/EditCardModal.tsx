import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Lock, 
  User, 
  Landmark, 
  Layers,
  Save,
  Check,
  RotateCcw,
  ArrowRightLeft
} from 'lucide-react';
import { 
  Card, 
  CardType, 
  CardTier, 
  CardNetwork, 
  CardTheme, 
  CardStatus,
  UserAccount, 
  AdminUser 
} from '../types';
import { formatCurrency, maskCardNumber } from '../utils/bankUtils';
import { CardVisual } from './CardVisual';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  users: UserAccount[];
  currentAdmin: AdminUser;
  onSaveCard: (updatedCard: Card) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  card,
  users,
  currentAdmin,
  onSaveCard,
}) => {
  const [cardholderName, setCardholderName] = useState(card.cardholderName);
  const [selectedUserId, setSelectedUserId] = useState(card.userId);
  const [cardNickname, setCardNickname] = useState(card.cardNickname || '');
  const [cardType, setCardType] = useState<CardType>(card.type);
  const [cardTier, setCardTier] = useState<CardTier>(card.tier);
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>(card.network);
  const [cardTheme, setCardTheme] = useState<CardTheme>(card.theme);
  const [cardStatus, setCardStatus] = useState<CardStatus>(card.status);
  
  const [creditLimit, setCreditLimit] = useState<number>(card.creditLimit || 200000);
  const [dailyAtmLimit, setDailyAtmLimit] = useState<number>(card.dailyAtmLimit || 50000);
  const [dailyPosLimit, setDailyPosLimit] = useState<number>(card.dailyPosLimit || card.dailyOnlineLimit || 100000);
  
  const [onlinePurchasesEnabled, setOnlinePurchasesEnabled] = useState(card.onlinePurchasesEnabled ?? card.allowOnline ?? true);
  const [internationalUsage, setInternationalUsage] = useState(card.internationalUsage ?? card.allowInternational ?? true);
  const [contactlessEnabled, setContactlessEnabled] = useState(card.contactlessEnabled ?? card.allowContactless ?? true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      setCardholderName(card.cardholderName);
      setSelectedUserId(card.userId);
      setCardNickname(card.cardNickname || '');
      setCardType(card.type);
      setCardTier(card.tier);
      setCardNetwork(card.network);
      setCardTheme(card.theme);
      setCardStatus(card.status);
      setCreditLimit(card.creditLimit || 200000);
      setDailyAtmLimit(card.dailyAtmLimit || 50000);
      setDailyPosLimit(card.dailyPosLimit || card.dailyOnlineLimit || 100000);
      setOnlinePurchasesEnabled(card.onlinePurchasesEnabled ?? card.allowOnline ?? true);
      setInternationalUsage(card.internationalUsage ?? card.allowInternational ?? true);
      setContactlessEnabled(card.contactlessEnabled ?? card.allowContactless ?? true);
      setShowSavedSuccess(false);
    }
  }, [isOpen, card]);

  if (!isOpen) return null;

  const assignedCustomer = users.find((u) => u.id === selectedUserId) || users[0];

  // Live updated temporary card for preview
  const previewCard: Card = {
    ...card,
    cardholderName: cardholderName.toUpperCase().trim() || assignedCustomer?.name.toUpperCase() || 'VALUED CUSTOMER',
    userId: selectedUserId,
    type: cardType,
    tier: cardTier,
    network: cardNetwork,
    theme: cardTheme,
    status: cardStatus,
    creditLimit,
    dailyAtmLimit,
    dailyPosLimit,
    dailyOnlineLimit: dailyPosLimit,
    cardNickname,
    onlinePurchasesEnabled,
    allowOnline: onlinePurchasesEnabled,
    internationalUsage,
    allowInternational: internationalUsage,
    contactlessEnabled,
    allowContactless: contactlessEnabled,
  };

  const handleUserAssignmentChange = (userId: string) => {
    setSelectedUserId(userId);
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      // Auto-suggest the new customer's uppercase name as cardholder name
      setCardholderName(targetUser.name.toUpperCase());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedCard: Card = {
      ...card,
      cardholderName: cardholderName.toUpperCase().trim(),
      userId: selectedUserId,
      accountId: assignedCustomer?.accountNumber || card.accountId,
      cardNickname: cardNickname.trim() || `${cardType} ${cardNetwork} Card`,
      type: cardType,
      tier: cardTier,
      network: cardNetwork,
      theme: cardTheme,
      status: cardStatus,
      creditLimit: cardType === 'CREDIT' ? Number(creditLimit) : 0,
      dailyAtmLimit: Number(dailyAtmLimit),
      dailyPosLimit: Number(dailyPosLimit),
      dailyOnlineLimit: Number(dailyPosLimit),
      onlinePurchasesEnabled,
      allowOnline: onlinePurchasesEnabled,
      internationalUsage,
      allowInternational: internationalUsage,
      contactlessEnabled,
      allowContactless: contactlessEnabled,
    };

    setTimeout(() => {
      onSaveCard(updatedCard);
      setIsSubmitting(false);
      setShowSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-[#004B87]/30 shadow-2xl w-full max-w-4xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  CBS CARD MAINTENANCE
                </span>
                <span className="text-xs text-blue-200 font-mono">ID: {card.id}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Edit Cardholder Name & Account Assignment
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Grid */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Live Card Preview & Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Live Card Specimen Preview
              </div>

              {/* Render Card Visual */}
              <div className="transform transition-transform hover:scale-[1.02] duration-200">
                <CardVisual card={previewCard} showControls={false} />
              </div>

              {/* Card Meta Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Card Number:</span>
                  <span className="font-mono font-bold text-slate-800">{maskCardNumber(card.cardNumber)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">CVV / Expiry:</span>
                  <span className="font-mono font-bold text-slate-800">*** / {card.expiryMonth}/{card.expiryYear}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Current Assigned User:</span>
                  <strong className="text-slate-900">{assignedCustomer?.name || 'N/A'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Issued On:</span>
                  <span className="text-slate-700">{card.issuedDate}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Form Controls */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Cardholder Name Field */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                  Cardholder Embossed Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  placeholder="e.g. SUHANTH"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 font-mono font-black text-sm uppercase tracking-wider text-slate-900 bg-white"
                  required
                />
                <p className="text-[11px] text-slate-600">
                  This is the exact name printed on the card face and sent in Visa/RuPay OTP transaction authorization emails.
                </p>
              </div>

              {/* Customer Assignment Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  Assign / Reassign to Customer Account
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserAssignmentChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#004B87] focus:ring-3 focus:ring-blue-500/20 text-xs font-bold text-slate-900 bg-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — A/c: {u.accountNumber} ({u.accountType.replace(/_/g, ' ')}) [CIF: {u.cifNumber || 'N/A'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid of Nickname & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Card Nickname / Label
                  </label>
                  <input
                    type="text"
                    value={cardNickname}
                    onChange={(e) => setCardNickname(e.target.value)}
                    placeholder="e.g. Corporate Platinum"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#004B87] text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={cardStatus}
                    onChange={(e) => setCardStatus(e.target.value as CardStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#004B87] text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Operational)</option>
                    <option value="FROZEN">FROZEN (Temporarily Locked)</option>
                    <option value="BLOCKED">BLOCKED (Permanent Lock)</option>
                    <option value="PENDING_PIN">PENDING PIN SET</option>
                  </select>
                </div>
              </div>

              {/* Grid of Network, Tier, & Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Network
                  </label>
                  <select
                    value={cardNetwork}
                    onChange={(e) => setCardNetwork(e.target.value as CardNetwork)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="RUPAY">RuPay (NPCI)</option>
                    <option value="VISA">Visa International</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Card Type
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="DEBIT">DEBIT CARD</option>
                    <option value="CREDIT">CREDIT CARD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Visual Theme
                  </label>
                  <select
                    value={cardTheme}
                    onChange={(e) => setCardTheme(e.target.value as CardTheme)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="canara-signature-blue">Canara Blue</option>
                    <option value="canara-gold-rupay">Canara Gold RuPay</option>
                    <option value="canara-emerald-select">Emerald Select</option>
                    <option value="canara-sovereign-navy">Sovereign Navy</option>
                    <option value="midnight-navy">Midnight Obsidian</option>
                  </select>
                </div>
              </div>

              {/* Limits Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Daily ATM Limit (₹)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={dailyAtmLimit}
                    onChange={(e) => setDailyAtmLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                {cardType === 'CREDIT' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      step={25000}
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Daily POS / E-Com Limit (₹)
                    </label>
                    <input
                      type="number"
                      step={25000}
                      value={dailyPosLimit}
                      onChange={(e) => setDailyPosLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Security Toggles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlinePurchasesEnabled}
                    onChange={(e) => setOnlinePurchasesEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004B87] focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Online 3DS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internationalUsage}
                    onChange={(e) => setInternationalUsage(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004B87] focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">International</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactlessEnabled}
                    onChange={(e) => setContactlessEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004B87] focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Contactless NFC</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 px-6 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving CBS Updates...</span>
                    </>
                  ) : showSavedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Card Specifications Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Cardholder & Assignment</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
