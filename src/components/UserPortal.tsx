import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  Download, 
  Copy, 
  Check, 
  Search,
  Sliders, 
  ShieldCheck, 
  Landmark,
  Sparkles,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { 
  UserAccount, 
  Card, 
  Transaction, 
  CardStatus 
} from '../types';
import { formatCurrency, maskCardNumber } from '../utils/bankUtils';
import { CardVisual } from './CardVisual';

interface UserPortalProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  cards: Card[];
  transactions: Transaction[];
  onOpenTransferModal: () => void;
  onOpenCardDetails: (card: Card) => void;
  onUpdateCardStatus: (cardId: string, status: CardStatus) => void;
  onSwitchToAdminView?: () => void;
  onOpenGemini?: () => void;
  onClearPassbook?: () => void;
  onOpenRazorpaySimulator?: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  currentUser,
  allUsers,
  cards,
  transactions,
  onOpenTransferModal,
  onOpenCardDetails,
  onUpdateCardStatus,
  onSwitchToAdminView,
  onOpenGemini,
  onClearPassbook,
  onOpenRazorpaySimulator,
}) => {
  const [cardFilter, setCardFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('ALL');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Cards of this customer
  const userCards = cards.filter((c) => c.userId === currentUser.id);
  const filteredCards = userCards.filter((c) => {
    if (cardFilter === 'ALL') return true;
    return c.type === cardFilter;
  });

  const debitCards = userCards.filter((c) => c.type === 'DEBIT');
  const creditCards = userCards.filter((c) => c.type === 'CREDIT');
  const totalCreditLimit = creditCards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalCreditUsed = creditCards.reduce((sum, c) => sum + c.usedLimit, 0);

  // Transactions of this customer
  const userTransactions = transactions
    .filter((tx) => tx.accountId === currentUser.id)
    .filter((tx) => {
      const matchesSearch = 
        tx.merchantName.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(txSearch.toLowerCase());
      const matchesCat = txCategoryFilter === 'ALL' || tx.type === txCategoryFilter || tx.category === txCategoryFilter;
      return matchesSearch && matchesCat;
    });

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(currentUser.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const copyIfsc = () => {
    navigator.clipboard.writeText(currentUser.ifscCode || 'SRSA0000001');
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 2000);
  };

  const handleDownloadStatement = () => {
    const text = `========================================================================
SRSADMIN बैंक / SRSADMIN BANK - OFFICIAL ACCOUNT STATEMENT
========================================================================
Customer Name   : ${currentUser.name}
Customer CIF    : ${currentUser.cifNumber || '84920194821'}
Account Number  : ${currentUser.accountNumber}
Account Type    : ${currentUser.accountType.replace(/_/g, ' ')}
Branch / IFSC   : ${currentUser.branchName} (${currentUser.ifscCode})
Available Bal.  : ${formatCurrency(currentUser.balance)}
Statement Date  : ${new Date().toLocaleString()} IST

RECENT TRANSACTIONS:
------------------------------------------------------------------------
Date & Time       | Reference UTR       | Description             | Amount
------------------------------------------------------------------------
${userTransactions.map(t => `${t.timestamp.padEnd(17)} | ${t.referenceNumber.padEnd(19)} | ${t.merchantName.slice(0, 23).padEnd(23)} | ${t.type === 'DEBIT' ? '-' : '+'}${formatCurrency(t.amount)}`).join('\n')}
========================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRSADMIN_Statement_${currentUser.accountNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmClear = () => {
    if (onClearPassbook) {
      onClearPassbook();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Account Overview Header */}
      <div className="bg-white dark:bg-[#111C33] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentUser.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> KYC Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>{currentUser.branchName || 'Bengaluru Main Branch'}</span>
              <span>•</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">CIF: {currentUser.cifNumber}</span>
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Razorpay Test Simulator Button */}
            {onOpenRazorpaySimulator && (
              <button
                type="button"
                id="razorpay-sim-quick-btn"
                onClick={onOpenRazorpaySimulator}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Simulate online merchant payment with RuPay 3D Secure OTP"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Razorpay Gateway Test</span>
              </button>
            )}

            <button
              type="button"
              id="user-transfer-btn"
              onClick={onOpenTransferModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003866] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>Send Money</span>
            </button>

            <button
              type="button"
              id="user-statement-btn"
              onClick={handleDownloadStatement}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">e-Statement</span>
            </button>

            {onOpenGemini && (
              <button
                type="button"
                onClick={onOpenGemini}
                className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700/60 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span className="hidden sm:inline">AI Analysis</span>
              </button>
            )}
          </div>
        </div>

        {/* Balance & Key Identifiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Primary Account Balance */}
          <div className="bg-[#0B192C] text-white rounded-xl p-4.5 flex flex-col justify-between shadow-xs border border-slate-800">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{currentUser.accountType.replace(/_/g, ' ')} Balance</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                {formatCurrency(currentUser.balance)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-[11px]">A/c: {currentUser.accountNumber}</span>
              <button
                type="button"
                onClick={copyAccountNumber}
                className="text-slate-400 hover:text-amber-400 transition-colors p-1 cursor-pointer"
                title="Copy Account Number"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Clearing Identifiers */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4.5 flex flex-col justify-between text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block mb-2">
                Clearing & Routing Codes
              </span>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>IFSC Code:</span>
                  <span className="font-mono font-bold text-[#004B87] dark:text-blue-400 flex items-center gap-1.5">
                    {currentUser.ifscCode || 'SRSA0000001'}
                    <button type="button" onClick={copyIfsc} className="text-slate-400 hover:text-[#004B87] cursor-pointer">
                      {copiedIfsc ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MICR Code:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{currentUser.micrCode || '560015001'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>UPI VPA:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{currentUser.upiId || `${currentUser.username}@srsa`}</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              PAN: {currentUser.panNumber} • Aadhaar: •••• {currentUser.aadhaarLast4}
            </div>
          </div>

          {/* Linked Cards Overview */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4.5 flex flex-col justify-between text-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Card Summary
                </span>
                <span className="font-mono font-bold text-xs bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                  {userCards.length} Total
                </span>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Debit Cards (RuPay):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{debitCards.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Credit Lines (Available):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalCreditLimit - totalCreditUsed)}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Contactless & Online Security Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Portfolio Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#004B87] dark:text-blue-400" />
              <span>Cards Portfolio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any card to view CVV, toggle security locks, or adjust transaction limits
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            {(['ALL', 'DEBIT', 'CREDIT'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCardFilter(filter)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  cardFilter === filter
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'All Cards' : filter === 'DEBIT' ? 'Debit' : 'Credit'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                className="bg-white dark:bg-[#111C33] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {card.cardNickname || (card.type === 'DEBIT' ? 'RuPay Platinum Debit' : 'RuPay Select Credit')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    card.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {card.status}
                  </span>
                </div>

                {/* Card Visual Component */}
                <div className="cursor-pointer">
                  <CardVisual
                    card={card}
                    showControls={true}
                    onCardClick={() => onOpenCardDetails(card)}
                  />
                </div>

                {/* Card Quick Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenCardDetails(card)}
                    className="text-[#004B87] dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Card Controls & PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateCardStatus(card.id, card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      card.status === 'ACTIVE'
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {card.status === 'ACTIVE' ? (
                      <>
                        <Lock className="w-3 h-3" /> Lock
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" /> Unlock
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white dark:bg-[#111C33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No {cardFilter.toLowerCase()} cards found</p>
            <p className="text-xs text-slate-400 mt-1">Visit your branch CBS desk to issue a new RuPay card.</p>
          </div>
        )}
      </div>

      {/* Transaction History & Passbook */}
      <div className="bg-white dark:bg-[#111C33] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#004B87] dark:text-blue-400" />
              <span>Passbook & Recent Activity</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live transaction ledger with official RBI UTR clearing references</p>
          </div>

          {/* Search, Category Filter & Clear Passbook Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search description or UTR..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400 w-44 sm:w-52"
              />
            </div>

            <select
              value={txCategoryFilter}
              onChange={(e) => setTxCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#004B87]"
            >
              <option value="ALL">All Types</option>
              <option value="DEBIT">Debits (-)</option>
              <option value="CREDIT">Credits (+)</option>
              <option value="UPI">UPI</option>
              <option value="IMPS">IMPS / NEFT</option>
              <option value="POS_PURCHASE">Card POS</option>
            </select>

            {/* Clear Passbook Button */}
            {onClearPassbook && userTransactions.length > 0 && (
              <button
                type="button"
                id="clear-passbook-btn"
                onClick={() => setShowClearConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear passbook transactions for this account"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Passbook</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Banner for Clear Passbook */}
        {showClearConfirm && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Clear all {userTransactions.length} recorded entries from your local passbook? Account balance will remain intact.</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-clear-passbook-btn"
                onClick={handleConfirmClear}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {userTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {userTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      tx.type === 'CREDIT'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.merchantName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{tx.timestamp}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">UTR: {tx.referenceNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-xs sm:text-sm font-bold ${
                      tx.type === 'CREDIT' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {tx.mode || 'CBS_CLEARING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2">
            <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              No transactions found in this passbook view.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Use "Send Money" or test with the Razorpay Simulator to record live transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
