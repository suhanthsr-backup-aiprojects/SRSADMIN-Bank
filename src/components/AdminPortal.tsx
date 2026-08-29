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
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  KeyRound,
  RotateCcw,
  UserCheck,
  Briefcase,
  Building,
  UserCog,
  RefreshCw,
  ExternalLink,
  ShieldAlert
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
  admins: AdminUser[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  currentAdmin: AdminUser;
  onOpenIssueCardModal: (userId?: string) => void;
  onOpenOpenAccountModal: () => void;
  onOpenBalanceAdjustModal: (userId?: string) => void;
  onOpenEditCustomerModal: (user: UserAccount) => void;
  onOpenEditCardModal: (card: Card) => void;
  onOpenKycModal: (user: UserAccount) => void;
  onAddAdmin: (newAdmin: AdminUser) => void;
  onDeleteAdmin: (adminId: string) => void;
  onSwitchAdmin: (admin: AdminUser) => void;
  onResetDemoData: (mode: 'CLEAN_DEFAULT' | 'CLEAR_ALL') => void;
  onUpdateCardStatus: (cardId: string, status: CardStatus) => void;
  onUpdateCardLimit: (cardId: string, newLimit: number) => void;
  onSelectCustomerToView: (user: UserAccount) => void;
  onCardClick?: (card: Card) => void;
  onOpenGemini?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  cards,
  users,
  admins,
  transactions,
  auditLogs,
  currentAdmin,
  onOpenIssueCardModal,
  onOpenOpenAccountModal,
  onOpenBalanceAdjustModal,
  onOpenEditCustomerModal,
  onOpenEditCardModal,
  onOpenKycModal,
  onAddAdmin,
  onDeleteAdmin,
  onSwitchAdmin,
  onResetDemoData,
  onUpdateCardStatus,
  onUpdateCardLimit,
  onSelectCustomerToView,
  onCardClick,
  onOpenGemini,
}) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'CUSTOMERS' | 'ADMINS' | 'TRANSACTIONS' | 'AUDIT'>('CARDS');
  const [cardSearch, setCardSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [cardStatusFilter, setCardStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN' | 'BLOCKED'>('ALL');
  
  // Password visibility state map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedAdminId, setCopiedAdminId] = useState<string | null>(null);

  // Add Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Suhanth@2626');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminEmployeeId, setNewAdminEmployeeId] = useState(`SRSA-EMP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newAdminRole, setNewAdminRole] = useState<AdminUser['role']>('BRANCH_MANAGER');
  const [newAdminDepartment, setNewAdminDepartment] = useState('Retail Banking & CBS Core Desk');
  const [newAdminBranch, setNewAdminBranch] = useState('0002 - Bengaluru Main Town Hall');

  // Reset Data Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
      u.email.toLowerCase().includes(q) ||
      u.panNumber.toLowerCase().includes(q)
    );
  });

  // Filtering admins
  const filteredAdmins = admins.filter((a) => {
    const q = adminSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.employeeId.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );
  });

  const togglePasswordVisibility = (adminId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [adminId]: !prev[adminId],
    }));
  };

  const copyAdminCredentials = (admin: AdminUser) => {
    const text = `User ID: ${admin.username}\nPassword: ${admin.password || 'Suhanth@2626'}\nEmployee Code: ${admin.employeeId}`;
    navigator.clipboard.writeText(text);
    setCopiedAdminId(admin.id);
    setTimeout(() => setCopiedAdminId(null), 2500);
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminUsername.trim()) return;

    const initials = newAdminName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AD';

    const newAdmin: AdminUser = {
      id: `adm_${Date.now().toString(36)}`,
      name: newAdminName.trim(),
      username: newAdminUsername.trim().toLowerCase(),
      password: newAdminPassword.trim() || 'Suhanth@2626',
      email: newAdminEmail.trim() || `${newAdminUsername.trim().toLowerCase()}@srsadminbank.com`,
      employeeId: newAdminEmployeeId.trim(),
      role: newAdminRole,
      department: newAdminDepartment,
      branchCode: newAdminBranch,
      lastLogin: 'Just now (New Provisioning)',
      badgeLevel: newAdminRole === 'SUPER_ADMIN' ? 'Scale V - Executive Director' : 'Scale IV - Chief Manager',
      avatarInitials: initials,
    };

    onAddAdmin(newAdmin);
    setIsAddAdminOpen(false);
    // Reset form
    setNewAdminName('');
    setNewAdminUsername('');
    setNewAdminEmail('');
  };

  const handleDownloadReport = () => {
    const text = `========================================================================
SRSADMIN बैंक / SRSADMIN BANK - BRANCH CBS OPERATIONS & AUDIT REPORT
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
${users.map(u => `• [${u.accountNumber}] CIF: ${u.cifNumber || 'N/A'} | ${u.name} | PAN: ${u.panNumber} | KYC: ${u.kycStatus} | Bal: ${formatCurrency(u.balance)}`).join('\n')}

ISSUED CARDS:
${cards.map(c => `• [${c.type}] ${c.cardholderName} | ${maskCardNumber(c.cardNumber)} | ${c.status} | Auth: ${c.issuedByAdminName}`).join('\n')}

ADMIN OFFICERS DIRECTORY:
${admins.map(a => `• [${a.employeeId}] ${a.name} (${a.username}) | ${a.role} | ${a.branchCode}`).join('\n')}
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
              <span>Add Customer</span>
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
              onClick={() => setIsResetModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset / Clear Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo Data</span>
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
            <span className="text-[11px] font-semibold text-slate-500 block">Customer Accounts</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {users.length} Active
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">KYC Verified & Registered</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Active RuPay / Visa Cards</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
              {cards.length} Total
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">{totalDebitCards} Debit • {totalCreditCards} Credit</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 block">Bank Officers & Staff</span>
            <div className="text-lg sm:text-xl font-black font-mono text-[#004B87] mt-1">
              {admins.length} Officers
            </div>
            <span className="text-[10px] text-amber-700 font-semibold mt-1 block">CBS Desk Authorized</span>
          </div>
        </div>
      </div>

      {/* CBS Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap">
        {[
          { id: 'CARDS', label: 'Card Portfolios', icon: CreditCard, count: cards.length },
          { id: 'CUSTOMERS', label: 'Customer Directory', icon: Users, count: users.length },
          { id: 'ADMINS', label: 'Admin Officers & Credentials', icon: UserCog, count: admins.length },
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

      {/* TAB 1: CARDS MANAGEMENT */}
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

              <button
                type="button"
                onClick={() => onOpenIssueCardModal()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue New Card</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((card) => {
              const cardOwner = users.find((u) => u.id === card.userId);
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{card.cardholderName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Assigned: {cardOwner?.name || 'Unassigned'} (A/c: {cardOwner?.accountNumber || 'N/A'})</p>
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

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenEditCardModal(card)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004B87] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Reassign</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenBalanceAdjustModal(card.userId)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                      >
                        Adjust
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
                        {card.status === 'ACTIVE' ? 'Lock' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS DIRECTORY */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, CIF, account number, PAN..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#004B87]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenOpenAccountModal}
                className="px-3.5 py-2 bg-[#004B87] hover:bg-[#003B6F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Account No & CIF</th>
                    <th className="py-3 px-4">PAN & Tax ID</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">KYC Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-bold">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{user.email} • {user.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div>{user.accountNumber}</div>
                        <div className="text-[10px] text-slate-400">CIF: {user.cifNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        <div>{user.panNumber || 'NOT SUBMITTED'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">UID: •••• {user.aadhaarLast4 || '8841'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {user.accountType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(user.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenKycModal(user)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            user.kycStatus === 'VERIFIED'
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                              : 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Open KYC Simulation Link & Verification"
                        >
                          {user.kycStatus === 'VERIFIED' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Run e-KYC</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenKycModal(user)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1"
                            title="Simulate KYC Verification with PAN & OTP"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>KYC Link</span>
                          </button>
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
                            title="Edit Parameters"
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

      {/* TAB 3: ADMIN OFFICERS & CREDENTIALS DIRECTORY */}
      {activeTab === 'ADMINS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search officer name, employee ID, role..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#004B87]"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddAdminOpen(true)}
              className="px-3.5 py-2 bg-[#004B87] hover:bg-[#003B6F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Bank Admin / Officer</span>
            </button>
          </div>

          {/* Admins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAdmins.map((admin) => {
              const isCurrent = admin.id === currentAdmin.id;
              const isPasswordVisible = !!visiblePasswords[admin.id];
              const passwordValue = admin.password || 'Suhanth@2626';

              return (
                <div
                  key={admin.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10' : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#004B87] text-white flex items-center justify-center font-black text-sm border border-blue-900/30">
                          {admin.avatarInitials || admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-sm">{admin.name}</h3>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                Active Desk
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 font-bold">{admin.employeeId}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#004B87] border border-blue-200">
                        {admin.role.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="text-slate-800 font-medium">{admin.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Branch Code:</span>
                        <span className="text-slate-800 font-mono font-semibold">{admin.branchCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Badge Level:</span>
                        <span className="text-slate-700 font-medium">{admin.badgeLevel}</span>
                      </div>
                    </div>

                    {/* Credentials Display Box */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          Login Credentials
                        </span>
                        <button
                          type="button"
                          onClick={() => copyAdminCredentials(admin)}
                          className="text-[11px] text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 hover:underline"
                        >
                          {copiedAdminId === admin.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-amber-700" />
                              <span>Copy Both</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-200">
                          <span className="text-slate-500 text-[11px]">User ID:</span>
                          <strong className="text-slate-900">{admin.username}</strong>
                        </div>

                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-200">
                          <span className="text-slate-500 text-[11px]">Password:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900">
                              {isPasswordVisible ? passwordValue : '••••••••••••'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(admin.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => onSwitchAdmin(admin)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#004B87] hover:bg-[#003866] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Switch to this Officer</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        Current Officer Session
                      </span>
                    )}

                    {admins.length > 1 && !isCurrent && (
                      <button
                        type="button"
                        onClick={() => onDeleteAdmin(admin.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Officer Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS & CLEARING LEDGER */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Live Branch Clearing Transactions</h2>
            <span className="text-xs text-slate-500 font-mono">{transactions.length} Total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 30).map((tx) => (
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

      {/* TAB 5: AUDIT LOGS */}
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

      {/* MODAL: ADD ADMIN OFFICER */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-[#004B87]/30 shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="bg-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#FFB800]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                    CBS OFFICER PROVISIONING
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Register New Bank Administrator
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name of Officer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => {
                    setNewAdminName(e.target.value);
                    if (!newAdminUsername) {
                      setNewAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '.'));
                    }
                  }}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#004B87] text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    User ID (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. ramesh.c"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Employee ID Code
                  </label>
                  <input
                    type="text"
                    value={newAdminEmployeeId}
                    onChange={(e) => setNewAdminEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Role & Authority
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="SENIOR_CARD_ISSUER">Senior Card Issuer</option>
                    <option value="COMPLIANCE_OFFICER">Compliance & AML Officer</option>
                    <option value="TREASURY_LEAD">Treasury Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newAdminDepartment}
                  onChange={(e) => setNewAdminDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-[#004B87] hover:bg-[#003866] text-white font-bold shadow-md"
                >
                  Create Admin Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET DEMO DATA */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-rose-500/30 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Reset / Clear Demo Data</h3>
                <p className="text-xs text-slate-500">Choose how you'd like to refresh the core bank database.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This resets user accounts, cardholder names, cards, and clearing transactions to a clean, fresh state without any legacy demo artifacts.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetDemoData('CLEAN_DEFAULT');
                  setIsResetModalOpen(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-[#004B87] text-white font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Reset to Clean Primary State (Suhanth & Admins)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetDemoData('CLEAR_ALL');
                  setIsResetModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Demo Accounts (Keep Suhanth Only)</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
