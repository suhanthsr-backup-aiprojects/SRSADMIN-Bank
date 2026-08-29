import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  AdminUser, 
  Card, 
  Transaction, 
  AuditLog, 
  CardStatus 
} from './types';
import { 
  INITIAL_ADMINS, 
  INITIAL_USERS, 
  INITIAL_CARDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/AdminPortal';
import { UserPortal } from './components/UserPortal';
import { LoginPage } from './components/LoginPage';
import { OpenAccountModal } from './components/OpenAccountModal';
import { BalanceAdjustmentModal } from './components/BalanceAdjustmentModal';
import { EditCustomerModal } from './components/EditCustomerModal';
import { IssueCardModal } from './components/IssueCardModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TransferModal } from './components/TransferModal';
import { CardDetailsModal } from './components/CardDetailsModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ShristiFloatingMascot } from './components/ShristiFloatingMascot';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Lock, 
  CreditCard, 
  RefreshCw,
  Landmark,
  PhoneCall,
  Sparkles,
  Info
} from 'lucide-react';
import { formatCurrency, maskCardNumber, generateCanaraUtrNumber } from './utils/bankUtils';
import { CanaraLogo } from './components/CanaraLogo';
import shristiAvatar from './assets/images/shristi_mascot_1787969749809.jpg';

export default function App() {
  // Persistence state in localStorage
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_users');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].username !== 'admin' || parsed[0].password !== 'Suhanth@2626') {
            parsed[0].username = 'admin';
            parsed[0].password = 'Suhanth@2626';
            parsed[0].name = 'Suhanth';
          }
          return parsed;
        }
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_admins');
    if (saved) {
      try {
        const parsed: AdminUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].username !== 'admin' || parsed[0].password !== 'Suhanth@2626') {
            parsed[0].username = 'admin';
            parsed[0].password = 'Suhanth@2626';
            parsed[0].name = 'Suhanth';
            parsed[0].employeeId = 'SRSA-ADMIN-001';
            parsed[0].avatarInitials = 'SU';
          }
          return parsed;
        }
      } catch (e) {
        return INITIAL_ADMINS;
      }
    }
    return INITIAL_ADMINS;
  });

  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Authentication & session states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem('canara_srs_bank_is_auth');
    return savedAuth === 'true';
  });

  const [currentView, setCurrentView] = useState<'USER' | 'ADMIN'>('USER');
  const [currentUser, setCurrentUser] = useState<UserAccount>(users[0]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(admins[0]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(true);

  // Modals state
  const [isIssueCardModalOpen, setIsIssueCardModalOpen] = useState(false);
  const [preselectedUserIdForIssue, setPreselectedUserIdForIssue] = useState<string | undefined>(undefined);
  const [isOpenAccountModalOpen, setIsOpenAccountModalOpen] = useState(false);
  const [isBalanceAdjustModalOpen, setIsBalanceAdjustModalOpen] = useState(false);
  const [selectedUserForBalanceAdjust, setSelectedUserForBalanceAdjust] = useState<UserAccount | null>(null);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<UserAccount | null>(null);
  
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<Card | null>(null);
  const [isGeminiAssistantOpen, setIsGeminiAssistantOpen] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('canara_srs_bank_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('canara_srs_bank_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('canara_srs_bank_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('canara_srs_bank_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('canara_srs_bank_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('canara_srs_bank_is_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  // Keep currentUser in sync when user array changes (e.g. balance updates)
  useEffect(() => {
    const found = users.find((u) => u.id === currentUser.id);
    if (found) {
      setCurrentUser(found);
    }
  }, [users, currentUser.id]);

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Login Handlers
  const handleLoginCustomer = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentView('USER');
    setIsAuthenticated(true);
    showToast(
      'SRSADMIN NetBanking Session Active',
      `Welcome back, ${user.name}. A/c: ${user.accountNumber} | CIF: ${user.cifNumber || 'N/A'}`
    );
  };

  const handleLoginAdmin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setCurrentView('ADMIN');
    setIsAdminAuthenticated(true);
    setIsAuthenticated(true);
    showToast(
      'SRSADMIN CBS Terminal Authenticated',
      `Welcome, Officer ${admin.name} (${admin.employeeId}). Branch desk active.`
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showToast('Secure Session Closed', 'You have been securely signed out of SRSADMIN NetBanking / CBS.', 'info');
  };

  // 1. Open New Bank Account (Admin Action)
  const handleAccountCreated = (newUser: UserAccount, initialCard?: Card) => {
    setUsers((prev) => [newUser, ...prev]);

    // If initial deposit > 0, create opening deposit transaction
    if (newUser.balance > 0) {
      const depositTx: Transaction = {
        id: `tx_${Date.now().toString(36)}_open`,
        accountId: newUser.id,
        accountNumber: newUser.accountNumber,
        amount: newUser.balance,
        type: 'CREDIT',
        category: 'ADMIN_BALANCE_ADJUSTMENT',
        mode: 'CBS_CLEARING',
        merchantName: 'SRSADMIN Branch Cash Counter (Opening Deposit)',
        merchantCategory: 'Branch Cash Operations',
        status: 'COMPLETED',
        timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        referenceNumber: generateCanaraUtrNumber('IMPS'),
        notes: `Opening cash deposit authorized by Branch Officer ${currentAdmin.name}`,
      };
      setTransactions((prev) => [depositTx, ...prev]);
    }

    // If initial card issued
    if (initialCard) {
      setCards((prev) => [initialCard, ...prev]);
    }

    // Add Audit Log
    const openLog: AuditLog = {
      id: `log_${Date.now().toString(36)}_open`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'CUSTOMER_ACCOUNT_OPENED',
      targetType: 'USER',
      targetId: newUser.id,
      details: `Enrolled customer ${newUser.name} with ${newUser.accountType.replace(/_/g, ' ')} A/c ${newUser.accountNumber} (CIF: ${newUser.cifNumber}). Initial deposit: ${formatCurrency(newUser.balance)}.${initialCard ? ` Issued primary RuPay ${initialCard.type} card.` : ''}`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'INFO',
    };
    setAuditLogs((prev) => [openLog, ...prev]);

    showToast(
      'SRSADMIN Account Successfully Opened',
      `Account ${newUser.accountNumber} & CIF ${newUser.cifNumber} provisioned for ${newUser.name}.`
    );
  };

  // 2. Adjust Balance / Ledger Modification (Admin Action)
  const handleBalanceAdjusted = (
    userId: string,
    newBalance: number,
    transaction: Transaction,
    auditLog: AuditLog
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u))
    );

    setTransactions((prev) => [transaction, ...prev]);
    setAuditLogs((prev) => [auditLog, ...prev]);

    const target = users.find((u) => u.id === userId);
    showToast(
      'SRSADMIN Ledger Updated by Branch Desk',
      `New balance for ${target?.name || 'Customer'}: ${formatCurrency(newBalance)}. UTR: ${transaction.referenceNumber}`
    );
  };

  // 3. Update Customer Profile & Governance (Admin Action)
  const handleUpdateCustomer = (updatedUser: UserAccount, auditLog: AuditLog) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setAuditLogs((prev) => [auditLog, ...prev]);

    showToast(
      'Customer Master Record Updated',
      `SRSADMIN CBS parameters & KYC modified for ${updatedUser.name}.`
    );
  };

  // Card Issuance by Admin Handler
  const handleCardIssued = (newCard: Card) => {
    setCards((prev) => [newCard, ...prev]);

    const newLog: AuditLog = {
      id: `log_${Date.now().toString(36)}`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: `${newCard.type}_CARD_ISSUED`,
      targetType: 'CARD',
      targetId: newCard.id,
      details: `Issued ${newCard.tier.replace(/_/g, ' ')} ${newCard.type} Card (${maskCardNumber(newCard.cardNumber)}) to ${newCard.cardholderName} with ${newCard.type === 'CREDIT' ? `₹${newCard.creditLimit.toLocaleString('en-IN')} credit line` : 'linked savings account'}.`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'INFO',
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      'Card Issued in SRSADMIN CBS',
      `RuPay / Visa card authorized for ${newCard.cardholderName}. Available immediately in customer NetBanking.`
    );
  };

  // Card Status (Freeze / Unfreeze) Handler
  const handleUpdateCardStatus = (cardId: string, newStatus: CardStatus) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    const targetCard = cards.find((c) => c.id === cardId);
    if (targetCard) {
      const newLog: AuditLog = {
        id: `log_${Date.now().toString(36)}`,
        adminId: currentAdmin.id,
        adminName: currentAdmin.name,
        action: `CARD_STATUS_${newStatus}`,
        targetType: 'CARD',
        targetId: cardId,
        details: `Updated status of card ${maskCardNumber(targetCard.cardNumber)} (${targetCard.cardholderName}) to ${newStatus}.`,
        timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
        severity: newStatus === 'FROZEN' ? 'WARNING' : 'INFO',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }

    if (selectedCardForDetails && selectedCardForDetails.id === cardId) {
      setSelectedCardForDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    showToast(
      `Card Status Updated: ${newStatus}`,
      `Security flag updated in SRSADMIN Card Switch.`,
      newStatus === 'FROZEN' ? 'warning' : 'success'
    );
  };

  // Card Limit Adjustment Handler
  const handleUpdateCardLimit = (cardId: string, newLimit: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, creditLimit: newLimit } : c))
    );

    const targetCard = cards.find((c) => c.id === cardId);
    if (targetCard) {
      const newLog: AuditLog = {
        id: `log_${Date.now().toString(36)}`,
        adminId: currentAdmin.id,
        adminName: currentAdmin.name,
        action: 'CREDIT_LIMIT_ADJUSTED',
        targetType: 'CARD',
        targetId: cardId,
        details: `Adjusted credit line on ${maskCardNumber(targetCard.cardNumber)} to ${formatCurrency(newLimit)}.`,
        timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
        severity: 'INFO',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }

    showToast(
      'Credit Limit Adjusted',
      `New limit of ${formatCurrency(newLimit)} authorized and applied in CBS.`
    );
  };

  // Customer Transfer Execution
  const handleExecuteTransfer = (newTx: Transaction, updatedBalance: number) => {
    setTransactions((prev) => [newTx, ...prev]);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, balance: updatedBalance } : u))
    );

    // If card payment, reduce used credit limit
    if (newTx.cardId && newTx.category === 'BILL_PAY') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === newTx.cardId
            ? { ...c, usedLimit: Math.max(0, c.usedLimit - newTx.amount) }
            : c
        )
      );
    }

    showToast(
      'Transfer Completed Successfully',
      `${formatCurrency(newTx.amount)} dispatched via ${newTx.mode || 'IMPS'}. UTR: ${newTx.referenceNumber}`
    );
  };

  // Simulate POS / Online Purchase on Card
  const handleSimulateTransaction = (card: Card, amount: number, merchant: string) => {
    if (card.status !== 'ACTIVE') {
      showToast('Transaction Declined', 'Card is locked or frozen. Please unlock card first in SRSADMIN portal.', 'warning');
      return;
    }

    // Check limits
    if (card.type === 'CREDIT') {
      if (card.usedLimit + amount > card.creditLimit) {
        showToast('Transaction Declined', 'Credit limit exceeded on this card.', 'warning');
        return;
      }
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, usedLimit: c.usedLimit + amount } : c))
      );
    } else {
      // Debit: deduce balance
      const cardOwner = users.find((u) => u.id === card.userId);
      if (!cardOwner || cardOwner.balance < amount) {
        showToast('Transaction Declined', 'Insufficient balance in linked SRSADMIN account.', 'warning');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === card.userId ? { ...u, balance: u.balance - amount } : u))
      );
    }

    const newTx: Transaction = {
      id: `tx_${Date.now().toString(36)}`,
      cardId: card.id,
      accountId: card.userId,
      accountNumber: currentUser.accountNumber,
      amount: amount,
      type: 'DEBIT',
      category: 'POS_PURCHASE',
      mode: 'RUPAY_POS',
      merchantName: merchant,
      merchantCategory: 'RuPay EMV Merchant Transaction',
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      referenceNumber: generateCanaraUtrNumber('IMPS'),
      cardLast4: card.cardNumber.replace(/\s+/g, '').slice(-4),
    };

    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      'Card Purchase Authorized',
      `${formatCurrency(amount)} authorized at ${merchant} on card •••• ${card.cardNumber.slice(-4)}`
    );
  };

  // Reset to sample data
  const handleResetData = () => {
    if (confirm('Reset SRSADMIN bank environment and sample customer portfolios back to default?')) {
      localStorage.clear();
      setUsers(INITIAL_USERS);
      setAdmins(INITIAL_ADMINS);
      setCards(INITIAL_CARDS);
      setTransactions(INITIAL_TRANSACTIONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentUser(INITIAL_USERS[0]);
      setCurrentAdmin(INITIAL_ADMINS[0]);
      setIsAuthenticated(true);
      showToast('Environment Reset', 'SRSADMIN sample data restored.');
    }
  };

  // If not logged in, render the authentic Bank Login Page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          users={users}
          admins={admins}
          onLoginCustomer={handleLoginCustomer}
          onLoginAdmin={handleLoginAdmin}
          onOpenGemini={() => setIsGeminiAssistantOpen(true)}
        />
        <GeminiAssistantModal
          isOpen={isGeminiAssistantOpen}
          onClose={() => setIsGeminiAssistantOpen(false)}
          currentView="USER"
          currentUser={users[0]}
          currentAdmin={admins[0]}
          cards={cards}
          transactions={transactions}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 font-sans flex flex-col justify-between selection:bg-[#FFB800] selection:text-[#003B6F]">
      <div>
        {/* Navigation Bar */}
        <Navbar
          currentView={currentView}
          currentUser={currentUser}
          currentAdmin={currentAdmin}
          onLogout={handleLogout}
          onOpenGemini={() => setIsGeminiAssistantOpen(true)}
        />

        {/* Toast Popup Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-md bg-white border border-slate-200 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              toastMessage.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {toastMessage.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-[#004B87]">{toastMessage.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{toastMessage.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {currentView === 'ADMIN' ? (
            <AdminPortal
              cards={cards}
              users={users}
              transactions={transactions}
              auditLogs={auditLogs}
              currentAdmin={currentAdmin}
              onOpenIssueCardModal={(userId) => {
                setPreselectedUserIdForIssue(userId);
                setIsIssueCardModalOpen(true);
              }}
              onOpenOpenAccountModal={() => setIsOpenAccountModalOpen(true)}
              onOpenBalanceAdjustModal={(userId) => {
                const target = userId ? users.find((u) => u.id === userId) : null;
                setSelectedUserForBalanceAdjust(target || null);
                setIsBalanceAdjustModalOpen(true);
              }}
              onOpenEditCustomerModal={(user) => {
                setSelectedCustomerToEdit(user);
                setIsEditCustomerModalOpen(true);
              }}
              onUpdateCardStatus={handleUpdateCardStatus}
              onUpdateCardLimit={handleUpdateCardLimit}
              onSelectCustomerToView={(u) => {
                setCurrentUser(u);
                setCurrentView('USER');
                showToast('Switched to Customer View', `Viewing NetBanking as ${u.name}`);
              }}
              onCardClick={(card) => setSelectedCardForDetails(card)}
              onOpenGemini={() => setIsGeminiAssistantOpen(true)}
            />
          ) : (
            <UserPortal
              currentUser={currentUser}
              allUsers={users}
              cards={cards}
              transactions={transactions}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
              onOpenCardDetails={(card) => setSelectedCardForDetails(card)}
              onUpdateCardStatus={handleUpdateCardStatus}
              onSwitchToAdminView={() => {
                if (isAdminAuthenticated) {
                  setCurrentView('ADMIN');
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
              onOpenGemini={() => setIsGeminiAssistantOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Shristi Copilot Launcher Button */}
      <button
        type="button"
        id="floating-gemini-trigger"
        onClick={() => setIsGeminiAssistantOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#004B87] hover:bg-[#003866] text-white shadow-xl hover:shadow-2xl border border-amber-400/60 font-bold text-xs transition-transform active:scale-95 cursor-pointer group"
        title="Open Shristi AI Banking Assistant"
      >
        <div className="relative">
          <img
            src={shristiAvatar}
            alt="Shristi Mascot"
            className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#004B87]" />
        </div>
        <span className="font-sans flex items-center gap-1.5">
          <span className="hidden sm:inline">Ask</span> Shristi
          <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        </span>
      </button>

      {/* Gemini AI Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isGeminiAssistantOpen}
        onClose={() => setIsGeminiAssistantOpen(false)}
        currentView={currentView}
        currentUser={currentUser}
        currentAdmin={currentAdmin}
        cards={cards}
        transactions={transactions}
      />

      {/* Modals */}
      {/* 1. Admin Open New Customer Account Modal */}
      <OpenAccountModal
        isOpen={isOpenAccountModalOpen}
        onClose={() => setIsOpenAccountModalOpen(false)}
        currentAdmin={currentAdmin}
        existingUsers={users}
        onAccountCreated={handleAccountCreated}
      />

      {/* 2. Admin Balance & Ledger Adjustment Modal */}
      <BalanceAdjustmentModal
        isOpen={isBalanceAdjustModalOpen}
        onClose={() => {
          setIsBalanceAdjustModalOpen(false);
          setSelectedUserForBalanceAdjust(null);
        }}
        users={users}
        selectedUser={selectedUserForBalanceAdjust}
        currentAdmin={currentAdmin}
        onBalanceAdjusted={handleBalanceAdjusted}
      />

      {/* 3. Admin Edit Customer Profile & KYC Modal */}
      <EditCustomerModal
        isOpen={isEditCustomerModalOpen}
        onClose={() => {
          setIsEditCustomerModalOpen(false);
          setSelectedCustomerToEdit(null);
        }}
        user={selectedCustomerToEdit}
        currentAdmin={currentAdmin}
        onUpdateUser={handleUpdateCustomer}
      />

      {/* 4. Admin Card Issuing Wizard */}
      <IssueCardModal
        isOpen={isIssueCardModalOpen}
        onClose={() => {
          setIsIssueCardModalOpen(false);
          setPreselectedUserIdForIssue(undefined);
        }}
        users={users}
        currentAdmin={currentAdmin}
        onCardIssued={handleCardIssued}
        preselectedUserId={preselectedUserIdForIssue}
      />

      {/* 5. Admin Security Clearance Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(admin) => {
          setCurrentAdmin(admin);
          setIsAdminAuthenticated(true);
          setCurrentView('ADMIN');
          setIsAdminLoginOpen(false);
          showToast('Officer Authenticated', `Welcome ${admin.name}. Branch Desk is active.`);
        }}
      />

      {/* 6. Customer Fund Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentUser={currentUser}
        allUsers={users}
        userCards={cards.filter((c) => c.userId === currentUser.id)}
        onExecuteTransfer={handleExecuteTransfer}
      />

      {/* 7. Card Details / Deep Dive Inspection Modal */}
      <CardDetailsModal
        card={selectedCardForDetails}
        isOpen={!!selectedCardForDetails}
        onClose={() => setSelectedCardForDetails(null)}
        onUpdateStatus={handleUpdateCardStatus}
        onSimulateTransaction={handleSimulateTransaction}
      />

      {/* SRSADMIN Bank Institutional Footer */}
      <footer className="border-t-4 border-[#FFB800] bg-[#004B87] py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-blue-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-blue-400/20">
            <div className="flex items-center gap-4">
              <CanaraLogo className="h-10 bg-white/10 p-2 rounded-xl" />
              <div>
                <p className="text-white font-bold text-sm">एसआरएसएडमिन बैंक | SRSADMIN BANK</p>
                <p className="text-[11px] text-blue-200">
                  Corporate Office: SRS Towers, Financial District, Bengaluru - 560 001, Karnataka, India
                </p>
                <p className="text-[10px] text-amber-300 font-mono">
                  IFSC: SRSA0000001 | MICR: 560015001 | SWIFT: SRSABINBBXXX
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">24x7 SRSADMIN Care Toll Free</span>
                <span className="text-sm font-black text-[#FFB800] font-mono">1800 425 0018 / 1800 103 0018</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFB800] text-[#003B6F] flex items-center justify-center font-bold">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-blue-200">
            <div className="flex items-center gap-4">
              <span>Deposits insured up to ₹5,00,000 by DICGC (RBI)</span>
              <span>•</span>
              <span>ISO 27001 Certified Security</span>
              <span>•</span>
              <span>RuPay / NPCI Enabled</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                id="reset-demo-data-btn"
                onClick={handleResetData}
                className="text-amber-300 hover:text-white underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Demo Ledger Data</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
