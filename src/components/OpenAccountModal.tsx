import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  FileText,
  X,
  Landmark,
  IndianRupee
} from 'lucide-react';
import { UserAccount, AdminUser, Card, CardType, CardTier, CardNetwork, CardTheme } from '../types';
import { formatCurrency, generateCardNumber, generateCVV, generatePIN, CANARA_BRANCHES, generateCanaraAccountNumber, generateCifNumber } from '../utils/bankUtils';

interface OpenAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: AdminUser;
  existingUsers: UserAccount[];
  onAccountCreated: (newUser: UserAccount, initialCard?: Card) => void;
}

export const OpenAccountModal: React.FC<OpenAccountModalProps> = ({
  isOpen,
  onClose,
  currentAdmin,
  existingUsers,
  onAccountCreated,
}) => {
  const [selectedBranch, setSelectedBranch] = useState(CANARA_BRANCHES[0]);
  
  // Personal & KYC info
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('UserPassword2026!');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98450 ');
  const [dob, setDob] = useState('1994-06-12');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [aadhaarLast4, setAadhaarLast4] = useState('8841');
  const [address, setAddress] = useState('No. 42, 100 Feet Road, Indiranagar, Bengaluru - 560038');
  const [companyName, setCompanyName] = useState('');

  // Account specs
  const [accountType, setAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CORPORATE_CURRENT'>('SAVINGS');
  const [initialDeposit, setInitialDeposit] = useState('50000');
  const [kycStatus, setKycStatus] = useState<'VERIFIED' | 'PENDING' | 'DOCUMENT_REQUIRED'>('VERIFIED');

  // Immediate RuPay Card Issuance option
  const [autoIssueCard, setAutoIssueCard] = useState(true);
  const [cardType, setCardType] = useState<CardType>('DEBIT');
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('RUPAY');
  const [cardTier, setCardTier] = useState<CardTier>('RUPAY_PLATINUM');
  const [cardTheme, setCardTheme] = useState<CardTheme>('canara-signature-blue');
  const [creditLimit, setCreditLimit] = useState('150000');

  // Validation
  const [usernameError, setUsernameError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const suggestedUsername = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    if (!username || username === suggestedUsername.slice(0, -1)) {
      setUsername(suggestedUsername);
      checkUsername(suggestedUsername);
    }
  };

  const checkUsername = (uname: string) => {
    const trimmed = uname.trim().toLowerCase();
    const exists = existingUsers.some((u) => u.username.toLowerCase() === trimmed);
    if (exists) {
      setUsernameError('This User ID is already taken. Please choose another.');
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) return;

    const trimmedUsername = username.trim().toLowerCase();
    const exists = existingUsers.some((u) => u.username.toLowerCase() === trimmedUsername);
    if (exists) {
      setUsernameError('This User ID is already assigned to another customer account.');
      return;
    }

    const depositAmount = parseFloat(initialDeposit) || 0;
    const newUserId = `cust-${Date.now()}`;
    const newAccountNumber = generateCanaraAccountNumber();
    const newCif = generateCifNumber();
    const newUpi = `${trimmedUsername}@srsa`;

    const newUser: UserAccount = {
      id: newUserId,
      name: name.trim(),
      username: trimmedUsername,
      password: password.trim() || 'UserPassword2026!',
      email: email.trim(),
      phone: phone.trim(),
      accountNumber: newAccountNumber,
      cifNumber: newCif,
      ifscCode: selectedBranch.ifsc,
      micrCode: selectedBranch.micr,
      branchName: selectedBranch.name,
      upiId: newUpi,
      panNumber: panNumber.toUpperCase().trim(),
      aadhaarLast4: aadhaarLast4.trim(),
      accountType,
      balance: depositAmount,
      currency: 'INR',
      accountStatus: 'ACTIVE',
      kycStatus,
      joinedDate: new Date().toLocaleDateString(),
      createdAt: new Date().toLocaleDateString(),
      address: address.trim(),
      companyName: companyName.trim() || undefined,
      profileRole: accountType === 'CORPORATE_CURRENT' ? 'Authorized Signatory' : 'Account Holder',
    };

    let initialCard: Card | undefined;

    if (autoIssueCard) {
      const expDate = new Date();
      expDate.setFullYear(expDate.getFullYear() + 5);
      const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
      const expYear = String(expDate.getFullYear()).slice(-2);

      initialCard = {
        id: `card-${Date.now()}`,
        userId: newUserId,
        cardNumber: generateCardNumber(cardNetwork),
        cardholderName: name.trim().toUpperCase(),
        expiryMonth: expMonth,
        expiryYear: expYear,
        cvv: generateCVV(cardNetwork),
        pin: generatePIN(),
        type: cardType,
        tier: cardTier,
        network: cardNetwork,
        status: 'ACTIVE',
        dailyAtmLimit: cardType === 'DEBIT' ? 50000 : 100000,
        dailyOnlineLimit: cardType === 'DEBIT' ? 100000 : 200000,
        creditLimit: cardType === 'CREDIT' ? parseFloat(creditLimit) || 150000 : 0,
        usedLimit: 0,
        theme: cardTheme,
        issuedByAdminId: currentAdmin.id,
        issuedByAdminName: currentAdmin.name,
        issuedDate: new Date().toLocaleDateString(),
        cardNickname: `${cardType === 'DEBIT' ? 'SRSADMIN RuPay Platinum Debit' : 'SRSADMIN Select Credit'}`,
        allowInternational: true,
        allowContactless: true,
        allowOnline: true,
        allowAtm: true,
      };
    }

    onAccountCreated(newUser, initialCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-[#004B87]/30 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#FFB800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  CBS FORM A-1
                </span>
                <span className="text-xs text-blue-200 font-mono">Branch: {selectedBranch.code}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Open New SRSADMIN Customer Account (CIF & A/C)
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Branch Selection */}
          <div className="bg-[#F0F6FC] p-4 rounded-2xl border border-[#CCE0F2]">
            <label className="block text-xs font-bold text-[#004B87] uppercase mb-1">
              Select Home Branch
            </label>
            <select
              value={selectedBranch.code}
              onChange={(e) => {
                const b = CANARA_BRANCHES.find(br => br.code === e.target.value);
                if (b) setSelectedBranch(b);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
            >
              {CANARA_BRANCHES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} (IFSC: {b.ifsc})
                </option>
              ))}
            </select>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#004B87] uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#FFB800]" />
              1. Customer Personal & Identity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Nair"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NetBanking User ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.nair"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    checkUsername(e.target.value);
                  }}
                  className={`w-full px-3.5 py-2 bg-[#F8FAFD] border rounded-xl text-xs font-medium focus:outline-none ${
                    usernameError ? 'border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-[#004B87]'
                  }`}
                />
                {usernameError && <p className="text-[11px] text-rose-600 mt-1">{usernameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.nair@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (+91) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhaar (Last 4 Digits) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="8841"
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#004B87]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Permanent Communication Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#004B87]"
              />
            </div>
          </div>

          {/* Section 3: Account Type & Initial Vault Deposit */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#004B87] uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#FFB800]" />
              2. Account Specs & Initial Cash / Transfer Deposit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Scheme
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
                >
                  <option value="SAVINGS">SRSADMIN SB General (Savings)</option>
                  <option value="CHECKING">SRSADMIN Premium SB</option>
                  <option value="CORPORATE_CURRENT">SRSADMIN Current A/c (Business)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Deposit Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-mono font-bold text-[#004B87] focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KYC Verification
                </label>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F8FAFD] border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#004B87]"
                >
                  <option value="VERIFIED">Biometric e-KYC Verified</option>
                  <option value="PENDING">Physical OVD Verified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Auto-Issue RuPay Card */}
          <div className="bg-[#FFFDF5] border border-[#FFE08A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-issue-card"
                  checked={autoIssueCard}
                  onChange={(e) => setAutoIssueCard(e.target.checked)}
                  className="w-4 h-4 text-[#004B87] rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto-issue-card" className="text-xs font-bold text-[#003B6F] cursor-pointer">
                  Auto-Issue SRSADMIN RuPay Platinum / Select Card immediately with Account
                </label>
              </div>
              <span className="text-[10px] font-bold uppercase bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                Instant Welcome Kit
              </span>
            </div>

            {autoIssueCard && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="DEBIT">Debit Card (RuPay)</option>
                    <option value="CREDIT">Credit Card (RuPay Select)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Theme</label>
                  <select
                    value={cardTheme}
                    onChange={(e) => setCardTheme(e.target.value as CardTheme)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="canara-signature-blue">SRSADMIN Signature Blue</option>
                    <option value="canara-gold-rupay">SRSADMIN Gold RuPay</option>
                    <option value="canara-emerald-select">SRSADMIN Emerald Select</option>
                    <option value="canara-sovereign-navy">SRSADMIN Sovereign Navy</option>
                  </select>
                </div>

                {cardType === 'CREDIT' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-[#004B87]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#003B6F]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
              <span>Authorize & Create Account in CBS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
