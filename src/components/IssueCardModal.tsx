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
  Layers 
} from 'lucide-react';
import { 
  Card, 
  CardType, 
  CardTier, 
  CardNetwork, 
  CardTheme, 
  UserAccount, 
  AdminUser 
} from '../types';
import { 
  generateCardNumber, 
  generateCVV, 
  generatePIN, 
  formatCurrency 
} from '../utils/bankUtils';
import { CardVisual } from './CardVisual';

interface IssueCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentAdmin: AdminUser;
  onCardIssued: (newCard: Card) => void;
  preselectedUserId?: string;
}

export const IssueCardModal: React.FC<IssueCardModalProps> = ({
  isOpen,
  onClose,
  users,
  currentAdmin,
  onCardIssued,
  preselectedUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    preselectedUserId || (users[0]?.id || '')
  );
  const [cardType, setCardType] = useState<CardType>('DEBIT');
  const [cardTier, setCardTier] = useState<CardTier>('RUPAY_PLATINUM');
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('RUPAY');
  const [cardTheme, setCardTheme] = useState<CardTheme>('canara-signature-blue');
  const [creditLimit, setCreditLimit] = useState<number>(200000);
  const [dailyAtmLimit, setDailyAtmLimit] = useState<number>(50000);
  const [dailyPosLimit, setDailyPosLimit] = useState<number>(100000);
  const [onlinePurchasesEnabled, setOnlinePurchasesEnabled] = useState(true);
  const [internationalUsage, setInternationalUsage] = useState(true);
  const [contactlessEnabled, setContactlessEnabled] = useState(true);
  const [cardNickname, setCardNickname] = useState('SRSADMIN RuPay Platinum');
  
  // Generated card identifiers
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('08');
  const [expiryYear, setExpiryYear] = useState('30');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const regenerateCardDetails = (network: CardNetwork) => {
    setCardNumber(generateCardNumber(network));
    setCvv(generateCVV(network));
    setPin(generatePIN());
  };

  useEffect(() => {
    if (isOpen) {
      if (preselectedUserId) {
        setSelectedUserId(preselectedUserId);
      }
      regenerateCardDetails(cardNetwork);
      
      const currentYear = new Date().getFullYear();
      setExpiryMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
      setExpiryYear(String((currentYear + 5) % 100));
    }
  }, [isOpen, preselectedUserId]);

  const handleNetworkChange = (network: CardNetwork) => {
    setCardNetwork(network);
    regenerateCardDetails(network);
    if (network === 'RUPAY') {
      setCardTier('RUPAY_PLATINUM');
      setCardNickname('SRSADMIN RuPay Platinum');
      setCardTheme('canara-signature-blue');
    } else if (network === 'VISA') {
      setCardTier('VISA_SIGNATURE');
      setCardNickname('SRSADMIN Visa Signature');
      setCardTheme('canara-sovereign-navy');
    }
  };

  const handleCardTypeChange = (type: CardType) => {
    setCardType(type);
    if (type === 'DEBIT') {
      setCardNickname('SRSADMIN RuPay Platinum Debit');
      setDailyAtmLimit(50000);
      setDailyPosLimit(100000);
    } else {
      setCardNickname('SRSADMIN RuPay Select Credit');
      setCardTier('RUPAY_SELECT');
      setCardTheme('canara-gold-rupay');
      setDailyAtmLimit(100000);
      setDailyPosLimit(200000);
    }
  };

  if (!isOpen || !selectedUser) return null;

  // Mock temporary card object for live preview
  const previewCard: Card = {
    id: 'preview-card',
    userId: selectedUser.id,
    cardNumber: cardNumber || '6521 8492 0194 8832',
    cardholderName: selectedUser.name.toUpperCase(),
    expiryMonth: expiryMonth,
    expiryYear: expiryYear,
    cvv: cvv || '482',
    pin: pin || '9012',
    type: cardType,
    tier: cardTier,
    network: cardNetwork,
    status: 'ACTIVE',
    dailyAtmLimit: dailyAtmLimit,
    dailyOnlineLimit: dailyPosLimit,
    creditLimit: cardType === 'CREDIT' ? creditLimit : 0,
    usedLimit: 0,
    theme: cardTheme,
    issuedByAdminId: currentAdmin.id,
    issuedByAdminName: currentAdmin.name,
    issuedDate: new Date().toLocaleDateString(),
    cardNickname: cardNickname,
    allowInternational: internationalUsage,
    allowContactless: contactlessEnabled,
    allowOnline: onlinePurchasesEnabled,
    allowAtm: true,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const newCard: Card = {
        id: `card_${Date.now().toString(36)}`,
        userId: selectedUser.id,
        cardNumber: cardNumber,
        cardholderName: selectedUser.name.toUpperCase(),
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: cvv,
        pin: pin,
        type: cardType,
        tier: cardTier,
        network: cardNetwork,
        status: 'ACTIVE',
        dailyAtmLimit: dailyAtmLimit,
        dailyOnlineLimit: dailyPosLimit,
        creditLimit: cardType === 'CREDIT' ? creditLimit : 0,
        usedLimit: 0,
        theme: cardTheme,
        issuedByAdminId: currentAdmin.id,
        issuedByAdminName: currentAdmin.name,
        issuedDate: new Date().toLocaleDateString(),
        cardNickname: cardNickname,
        allowInternational: internationalUsage,
        allowContactless: contactlessEnabled,
        allowOnline: onlinePurchasesEnabled,
        allowAtm: true,
      };

      onCardIssued(newCard);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
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
                  CBS FORM CR-02
                </span>
                <span className="text-xs text-blue-200 font-mono">Officer: {currentAdmin.name}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Issue SRSADMIN RuPay / Visa EMV Smart Card
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

        {/* Modal Grid: Form on Left, Live Card Preview on Right */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[80vh] overflow-y-auto">
          
          {/* Left Form: Specs & Limits */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            
            {/* Customer Recipient */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign to SRSADMIN Customer <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (A/c: {u.accountNumber} | CIF: {u.cifNumber || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Card Type & Network */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Type</label>
                <select
                  value={cardType}
                  onChange={(e) => handleCardTypeChange(e.target.value as CardType)}
                  className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="DEBIT">Debit Card (Savings/Current)</option>
                  <option value="CREDIT">Credit Card (Approved Line)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Network</label>
                <select
                  value={cardNetwork}
                  onChange={(e) => handleNetworkChange(e.target.value as CardNetwork)}
                  className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="RUPAY">RuPay (NPCI India)</option>
                  <option value="VISA">VISA International</option>
                  <option value="MASTERCARD">Mastercard Global</option>
                </select>
              </div>
            </div>

            {/* Card Tier & Visual Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Tier</label>
                <select
                  value={cardTier}
                  onChange={(e) => setCardTier(e.target.value as CardTier)}
                  className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="RUPAY_PLATINUM">RuPay Platinum (Global)</option>
                  <option value="RUPAY_SELECT">RuPay Select (Lounge & Concierge)</option>
                  <option value="VISA_SIGNATURE">Visa Signature Sovereign</option>
                  <option value="CLASSIC">Classic Domestic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plastic Emblem Theme</label>
                <select
                  value={cardTheme}
                  onChange={(e) => setCardTheme(e.target.value as CardTheme)}
                  className="w-full p-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="canara-signature-blue">SRSADMIN Signature Royal Blue</option>
                  <option value="canara-gold-rupay">SRSADMIN Gold RuPay</option>
                  <option value="canara-emerald-select">SRSADMIN Emerald Select</option>
                  <option value="canara-sovereign-navy">SRSADMIN Sovereign Navy</option>
                </select>
              </div>
            </div>

            {/* Card Nickname */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Embossed Card Name / Description</label>
              <input
                type="text"
                value={cardNickname}
                onChange={(e) => setCardNickname(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            {/* Limits */}
            {cardType === 'CREDIT' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Credit Line Limit (₹ INR) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold text-[#004B87]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily ATM Limit (₹)</label>
                  <input
                    type="number"
                    value={dailyAtmLimit}
                    onChange={(e) => setDailyAtmLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily POS / E-Com Limit (₹)</label>
                  <input
                    type="number"
                    value={dailyPosLimit}
                    onChange={(e) => setDailyPosLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Card Features Toggles */}
            <div className="bg-[#F0F6FC] p-3 rounded-xl border border-[#CCE0F2] flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contactlessEnabled}
                  onChange={(e) => setContactlessEnabled(e.target.checked)}
                  className="rounded text-[#004B87]"
                />
                <span>Contactless Wi-Fi</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={internationalUsage}
                  onChange={(e) => setInternationalUsage(e.target.checked)}
                  className="rounded text-[#004B87]"
                />
                <span>International Usage</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlinePurchasesEnabled}
                  onChange={(e) => setOnlinePurchasesEnabled(e.target.checked)}
                  className="rounded text-[#004B87]"
                />
                <span>E-Com Enabled</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#003B6F]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing RuPay Card Issuance in CBS...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
                    <span>Authorize & Issue Card in SRSADMIN CBS</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Live Preview */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Live Plastic Preview & Hologram
              </span>
              <CardVisual
                card={previewCard}
                showAdminBadge={true}
                interactiveFlip={true}
              />
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Click card to flip and review reverse magnetic strip & CVV
              </p>
            </div>

            <div className="bg-[#FFFDF5] border border-[#FFE08A] rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-[#855B00] font-bold">
                <span>Branch CBS Officer Authorization</span>
                <span className="font-mono text-[10px]">{currentAdmin.employeeId}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Card will immediately appear in the customer's SRSADMIN NetBanking portal upon branch dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
