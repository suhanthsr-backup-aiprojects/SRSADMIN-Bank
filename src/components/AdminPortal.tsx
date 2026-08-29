import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  Users, 
  Sliders, 
  Download, 
  FileText, 
  UserPlus, 
  Sparkles,
  Edit,
  Landmark,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  UserAccount, 
  AdminUser, 
  Transaction, 
  AuditLog, 
  CardStatus 
} from '../types';
import { formatCurrency, maskCardNumber } from '../utils/bankUtils';
import { CardVisual } from './CardVisual';

interface AdminPortalProps {
  cards: Card[];
  users: UserAccount[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  currentAdmin: AdminUser;
  onOpenIssueCardModal: (userId?: string) => void;
  onOpenOpenAccountModal: () => void;
  onOpenBalanceAdjustModal: (userId?: string) => void;
  onOpenEditCustomerModal: (user: UserAccount) => void;
  onUpdateCardStatus: (cardId: string, status: CardStatus) => void;
  onUpdateCardLimit: (cardId: string, newLimit: number) => void;
  onSelectCustomerToView: (user: UserAccount) => void;
  onCardClick?: (card: Card) => void;
  onOpenGemini?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  cards,
  users,
  transactions,
  auditLogs,
  currentAdmin,
  onOpenIssueCardModal,
  onOpenOpenAccountModal,
  onOpenBalanceAdjustModal,
  onOpenEditCustomerModal,
  onUpdateCardStatus,
  onUpdateCardLimit,
  onSelectCustomerToView,
  onCardClick,
  onOpenGemini,
}) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'CUSTOMERS' | 'TRANSACTIONS' | 'AUDIT'>('CARDS');
  const [cardSearch, setCardSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [cardStatusFilter, setCardStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN' | 'BLOCKED'>('ALL');

  // Stats calculation
  const totalCoreDeposits = users.reduce((sum, u) => sum + u.balance, 0);
  const totalDebitCards = cards.filter((c) => c.type === 'DEBIT').length;
  const totalCreditCards = cards.filter((c) => c.type === 'CREDIT').length;
  const totalCreditLimit = cards.filter((c) => c.type === 'CREDIT').reduce((sum, c) => sum + (c.creditLimit || 0), 0);

  // Filtering cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch = 
      card.cardholderName.toLowerCase().includes(cardSearch.toLowerCase()) ||
      card.cardNumber.includes(cardSearch) ||
      (card.cardNickname && card.cardNickname.toLowerCase().includes(cardSearch.toLowerCase()));
    const matchesType = cardTypeFilter === 'ALL' || card.type === cardTypeFilter;
    const matchesStatus = cardStatusFilter === 'ALL' || card.status === cardStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtering customers
  const filteredUsers = users.filter((u) => {
    const q = customerSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.accountNumber.toLowerCase().includes(q) ||
      (u.cifNumber && u.cifNumber.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleDownloadReport = () => {
    const text = `========================================================================
एसआरएसएडमिन बैंक / SRSADMIN BANK - BRANCH CBS OPERATIONS & AUDIT REPORT
========================================================================
Branch Officer  : ${currentAdmin.name} (${currentAdmin.employeeId})
Department      : ${currentAdmin.department} • Branch: ${currentAdmin.branchCode}
Report Date     : ${new Date().toLocaleString()} IST

PORTFOLIO OVERVIEW:
- Core Vault Deposits   : ${formatCurrency(totalCoreDeposits)}
- Total Customer Accounts: ${users.length}
- RuPay & Visa Cards    : ${cards.length} (${totalDebitCards} Debit, ${totalCreditCards} Credit)
- Credit Lines Extended : ${formatCurrency(totalCreditLimit)}

CUSTOMER ACCOUNTS:
${users.map(u => `• [${u.accountNumber}] CIF: ${u.cifNumber || 'N/A'} | ${u.name} | ${u.accountType} | Bal: ${formatCurrency(u.balance)} | Status: ${u.accountStatus}`).join('\n')}

ISSUED CARDS:
${cards.map(c => `• [${c.type}] ${c.cardholderName} | ${maskCardNumber(c.cardNumber)} | ${c.status} | Auth: ${c.issuedByAdminName}`).join('\n')}
========================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRSADMIN_CBS_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Officer Command Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Branch CBS Terminal
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Desk {currentAdmin.branchCode?.split('-')[0] || '0001'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Officer: <strong className="text-slate-800">{currentAdmin.name}</strong> ({currentAdmin.employeeId}) • {currentAdmin.role.replace(/_/g, ' ')}
            </p>
          </div>

          {/* CBS Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              id="admin-open-account-btn"
              onClick={onOpenOpenAccountModal}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003866] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Open Account</span>
            </button>

            <button
              type="button"
              id="admin-issue-card-btn"
              onClick={() => onOpenIssueCardModal()}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-slate-950" />
              <span>Issue Card</span>
            </button>

            <button
              type="button"
              id="admin-balance-adj-btn"
              onClick={() => onOpenBalanceAdjustModal()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Ledger Clearing</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
              title="Download Branch Report"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>

            {onOpenGemini && (
              <button
                type="button"
                onClick={onOpenGemini}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-blue-50 hover:from-amber-100 hover:to-blue-100 text-[#004B87] border border-amber-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Open Shristi Copilot"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">Ask Shristi</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Core Deposits</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {formatCurrency(totalCoreDeposits)}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Vault Cleared</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Customer Portfolios</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {users.length} Accounts
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">100% KYC Complete</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Active RuPay / Visa Cards</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {cards.length} Total
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">{totalDebitCards} Debit • {totalCreditCards} Credit</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Credit Line</span>
            <div className="text-lg sm:text-xl font-black font-mono text-[#004B87] mt-1">
              {formatCurrency(totalCreditLimit)}
            </div>
            <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Branch Authorized</span>
          </div>
        </div>
      </div>

      {/* CBS Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap">
        {[
          { id: 'CARDS', label: 'Card Portfolios', icon: CreditCard, count: cards.length },
          { id: 'CUSTOMERS', label: 'Customer Directory', icon: Users, count: users.length },
          { id: 'TRANSACTIONS', label: 'Clearing Transactions', icon: Landmark, count: transactions.length },
          { id: 'AUDIT', label: 'Security Audit Logs', icon: ShieldCheck, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#004B87] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Cards Management */}
      {activeTab === 'CARDS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search cardholder, card number..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#004B87]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={cardTypeFilter}
                onChange={(e) => setCardTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#004B87]"
              >
                <option value="ALL">All Types</option>
                <option value="DEBIT">Debit Cards</option>
                <option value="CREDIT">Credit Cards</option>
              </select>

              <select
                value={cardStatusFilter}
                onChange={(e) => setCardStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#004B87]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="FROZEN">Locked / Frozen</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((card) => {
              const cardOwner = users.find((u) => u.id === card.userId);
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{card.cardholderName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">A/c: {cardOwner?.accountNumber || 'N/A'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        card.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {card.status}
                      </span>
                    </div>

                    <div className="cursor-pointer" onClick={() => onCardClick && onCardClick(card)}>
                      <CardVisual card={card} showControls={false} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenBalanceAdjustModal(card.userId)}
                      className="text-[#004B87] hover:underline font-semibold"
                    >
                      Adjust Balance
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateCardStatus(card.id, card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        card.status === 'ACTIVE'
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {card.status === 'ACTIVE' ? 'Lock Card' : 'Unlock Card'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Customers Directory */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, CIF, account number..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#004B87]"
              />
            </div>
            <button
              type="button"
              onClick={onOpenOpenAccountModal}
              className="px-3.5 py-2 bg-[#004B87] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Customer</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Account No & CIF</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-bold">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div>{user.accountNumber}</div>
                        <div className="text-[10px] text-slate-400">CIF: {user.cifNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {user.accountType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(user.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectCustomerToView(user)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-[#004B87] rounded-lg text-xs font-semibold"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenBalanceAdjustModal(user.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold"
                          >
                            Ledger
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditCustomerModal(user)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Edit KYC Parameters"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Transactions & Clearing Ledger */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Live Branch Clearing Transactions</h2>
            <span className="text-xs text-slate-500 font-mono">{transactions.length} Total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.merchantName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      UTR: {tx.referenceNumber} • {tx.timestamp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{tx.mode || 'CBS'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Security & CBS Audit Trails</h2>
            <span className="text-xs text-slate-500 font-mono">{auditLogs.length} Records</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                      {log.targetType}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Officer: {log.adminName} • {log.timestamp}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
