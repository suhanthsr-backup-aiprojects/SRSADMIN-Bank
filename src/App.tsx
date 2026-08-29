import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { EditCardModal } from './components/EditCardModal';
import { KycSimulationModal } from './components/KycSimulationModal';
import { IssueCardModal } from './components/IssueCardModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TransferModal } from './components/TransferModal';
import { CardDetailsModal } from './components/CardDetailsModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { RazorpaySimulatorModal } from './components/RazorpaySimulatorModal';
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
  Info,
  Zap,
  Moon,
  Sun,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency, maskCardNumber, generateCanaraUtrNumber } from './utils/bankUtils';
import { CanaraLogo } from './components/CanaraLogo';

export default function App() {
  // Theme State (Persisted in localStorage and synchronized to document root)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('srsadmin_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('srsadmin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('srsadmin_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Persistence state in localStorage with clean data enforcement
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('canara_srs_bank_users');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Enforce Suhanth as primary demo user
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
    let initialCards = saved ? JSON.parse(saved) : INITIAL_CARDS;
    if (Array.isArray(initialCards)) {
      initialCards = initialCards.map((c) => {
        if (c.cardholderName === 'MARCUS SHARMA' || !c.cardholderName) {
          return { ...c, cardholderName: 'SUHANTH' };
        }
        return c;
      });
    }
    return initialCards;
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

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [currentView, setCurrentView] = useState<'USER' | 'ADMIN'>('USER');
  const [currentUser, setCurrentUser] = useState<UserAccount>(users[0] || INITIAL_USERS[0]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(admins[0] || INITIAL_ADMINS[0]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(true);

  // Modals state
  const [isIssueCardModalOpen, setIsIssueCardModalOpen] = useState(false);
  const [preselectedUserIdForIssue, setPreselectedUserIdForIssue] = useState<string | undefined>(undefined);
  const [isOpenAccountModalOpen, setIsOpenAccountModalOpen] = useState(false);
  const [isBalanceAdjustModalOpen, setIsBalanceAdjustModalOpen] = useState(false);
  const [selectedUserForBalanceAdjust, setSelectedUserForBalanceAdjust] = useState<UserAccount | null>(null);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<UserAccount | null>(null);
  
  // Edit Card Modal state
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [selectedCardToEdit, setSelectedCardToEdit] = useState<Card | null>(null);

  // KYC Simulation Modal state
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedCustomerForKyc, setSelectedCustomerForKyc] = useState<UserAccount | null>(null);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<Card | null>(null);
  const [isGeminiAssistantOpen, setIsGeminiAssistantOpen] = useState(false);
  
  // Razorpay Simulator Modal State
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [preselectedCardForRazorpay, setPreselectedCardForRazorpay] = useState<Card | null>(null);

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
    const found = users.find((u) => u.id === currentUser?.id);
    if (found) {
      setCurrentUser(found);
    } else if (users.length > 0) {
      setCurrentUser(users[0]);
    }
  }, [users, currentUser?.id]);

  // Check URL query parameters on load for direct KYC link (e.g. ?kyc=usr_suhanth_001)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const kycTargetId = params.get('kyc');
      if (kycTargetId) {
        const target = users.find((u) => u.id === kycTargetId) || users[0];
        if (target) {
          setSelectedCustomerForKyc(target);
          setIsKycModalOpen(true);
        }
      }
    } catch (e) {
      console.error('URL param parse error:', e);
    }
  }, [users]);

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Login Handlers with smooth animation
  const handleLoginCustomer = (user: UserAccount) => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setCurrentUser(user);
      setCurrentView('USER');
      setIsAuthenticated(true);
      setIsLoggingIn(false);
      showToast(
        'SRSADMIN NetBanking Session Active',
        `Welcome back, ${user.name}. A/c: ${user.accountNumber} | CIF: ${user.cifNumber || 'N/A'}`
      );
    }, 600);
  };

  const handleLoginAdmin = (admin: AdminUser) => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setCurrentAdmin(admin);
      setCurrentView('ADMIN');
      setIsAdminAuthenticated(true);
      setIsAuthenticated(true);
      setIsLoggingIn(false);
      showToast(
        'SRSADMIN CBS Terminal Authenticated',
        `Welcome, Officer ${admin.name} (${admin.employeeId}). Branch desk active.`
      );
    }, 600);
  };

  // Smooth Logout Handler
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setIsLoggingOut(false);
      showToast('Secure Session Closed', 'You have been securely signed out of SRSADMIN NetBanking / CBS.', 'info');
    }, 700);
  };

  // 1. Open New Bank Account (Admin Action)
  const handleAccountCreated = (newUser: UserAccount, initialCard?: Card) => {
    setUsers((prev) => [newUser, ...prev]);

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

    if (initialCard) {
      setCards((prev) => [initialCard, ...prev]);
    }

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

  // 3. Update Customer Profile (Admin Action)
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

  // 4. Save Edited Card (Cardholder Name & Assignment changes)
  const handleSaveEditedCard = (updatedCard: Card) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );

    const oldCard = cards.find((c) => c.id === updatedCard.id);
    const assignedUser = users.find((u) => u.id === updatedCard.userId);

    const editLog: AuditLog = {
      id: `log_${Date.now().toString(36)}_card_edit`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'CARD_PARAMETERS_MODIFIED',
      targetType: 'CARD',
      targetId: updatedCard.id,
      details: `Updated card ${maskCardNumber(updatedCard.cardNumber)}. Cardholder embossed name set to "${updatedCard.cardholderName}". Assigned to customer ${assignedUser?.name || 'User'} (A/c: ${updatedCard.accountId}).`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'INFO',
    };

    setAuditLogs((prev) => [editLog, ...prev]);

    showToast(
      'Card Updated Successfully',
      `Cardholder name "${updatedCard.cardholderName}" & customer assignment saved in CBS.`
    );
  };

  // 5. KYC Verification Completion Handler
  const handleKycVerified = (userId: string, panNumber: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, kycStatus: 'VERIFIED', panNumber: panNumber.toUpperCase() }
          : u
      )
    );

    const verifiedUser = users.find((u) => u.id === userId);

    const kycLog: AuditLog = {
      id: `log_${Date.now().toString(36)}_kyc`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'KYC_SIMULATION_VERIFIED',
      targetType: 'USER',
      targetId: userId,
      details: `e-KYC verification completed for ${verifiedUser?.name || 'Customer'}. Verified PAN: ${panNumber.toUpperCase()} with bank OTP authentication.`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'INFO',
    };

    setAuditLogs((prev) => [kycLog, ...prev]);

    showToast(
      'KYC Verified & Cleared',
      `Customer ${verifiedUser?.name || 'User'} is now fully verified with PAN ${panNumber.toUpperCase()}.`
    );
  };

  // 6. Admin User Management Handlers
  const handleAddAdmin = (newAdmin: AdminUser) => {
    setAdmins((prev) => [...prev, newAdmin]);

    const log: AuditLog = {
      id: `log_${Date.now().toString(36)}_admin_add`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'ADMIN_OFFICER_PROVISIONED',
      targetType: 'ADMIN',
      targetId: newAdmin.id,
      details: `Provisioned bank officer profile for ${newAdmin.name} (${newAdmin.employeeId}) with role ${newAdmin.role}.`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'INFO',
    };
    setAuditLogs((prev) => [log, ...prev]);

    showToast(
      'Bank Officer Registered',
      `Officer ${newAdmin.name} (${newAdmin.username}) added with active CBS credentials.`
    );
  };

  const handleDeleteAdmin = (adminId: string) => {
    const target = admins.find((a) => a.id === adminId);
    if (!target) return;

    setAdmins((prev) => prev.filter((a) => a.id !== adminId));

    const log: AuditLog = {
      id: `log_${Date.now().toString(36)}_admin_del`,
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      action: 'ADMIN_OFFICER_REVOKED',
      targetType: 'ADMIN',
      targetId: adminId,
      details: `Revoked access and deleted profile for officer ${target.name} (${target.employeeId}).`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
      severity: 'WARNING',
    };
    setAuditLogs((prev) => [log, ...prev]);

    showToast(
      'Officer Profile Removed',
      `Access revoked for ${target.name}.`,
      'info'
    );
  };

  const handleSwitchAdmin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    showToast(
      'Switched Officer Session',
      `Now logged in as Officer ${admin.name} (${admin.employeeId}) - Desk ${admin.branchCode}.`
    );
  };

  // 7. Clear / Reset Demo Data
  const handleResetDemoData = (mode: 'CLEAN_DEFAULT' | 'CLEAR_ALL') => {
    localStorage.removeItem('canara_srs_bank_users');
    localStorage.removeItem('canara_srs_bank_admins');
    localStorage.removeItem('canara_srs_bank_cards');
    localStorage.removeItem('canara_srs_bank_transactions');
    localStorage.removeItem('canara_srs_bank_audit_logs');

    if (mode === 'CLEAR_ALL') {
      // Keep only Suhanth clean
      const singleUser: UserAccount[] = [INITIAL_USERS[0]];
      const singleCard: Card[] = [INITIAL_CARDS[0]];
      setUsers(singleUser);
      setCards(singleCard);
      setTransactions([]);
      setAuditLogs(INITIAL_AUDIT_LOGS.slice(0, 2));
      setAdmins(INITIAL_ADMINS);
      setCurrentUser(singleUser[0]);
      setCurrentAdmin(INITIAL_ADMINS[0]);
      showToast('Demo Data Cleared', 'All secondary demo accounts removed. Fresh customer portfolio ready.');
    } else {
      // Clean default baseline with Suhanth everywhere
      setUsers(INITIAL_USERS);
      setAdmins(INITIAL_ADMINS);
      setCards(INITIAL_CARDS);
      setTransactions(INITIAL_TRANSACTIONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentUser(INITIAL_USERS[0]);
      setCurrentAdmin(INITIAL_ADMINS[0]);
      showToast('CBS State Restored', 'Reset to clean default bank records.');
    }
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

  // Clear Passbook Handler
  const handleClearPassbook = () => {
    setTransactions((prev) => prev.filter((t) => t.accountId !== currentUser.id));
    showToast(
      'Passbook Cleared',
      `All past recorded transactions for ${currentUser.name} have been cleared from local storage. Balance is untouched.`
    );
  };

  // Razorpay Simulation Payment Success Handler
  const handleRazorpayPaymentSuccess = (
    newTx: Transaction,
    updatedBalance: number,
    updatedCard?: Card
  ) => {
    setTransactions((prev) => [newTx, ...prev]);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, balance: updatedBalance } : u))
    );
    if (updatedCard) {
      setCards((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
      );
    }

    showToast(
      'Razorpay Test Payment Settled',
      `Payment of ${formatCurrency(newTx.amount)} to ${newTx.merchantName} verified with 3D-Secure OTP. Reference: ${newTx.referenceNumber}`
    );
  };

  // Simulate POS / Online Purchase on Card
  const handleSimulateTransaction = (card: Card, amount: number, merchant: string) => {
    if (card.status !== 'ACTIVE') {
      showToast('Transaction Declined', 'Card is locked or frozen. Please unlock card first in SRSADMIN portal.', 'warning');
      return;
    }

    if (card.type === 'CREDIT') {
      if (card.usedLimit + amount > card.creditLimit) {
        showToast('Transaction Declined', 'Credit limit exceeded on this card.', 'warning');
        return;
      }
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, usedLimit: c.usedLimit + amount } : c))
      );
    } else {
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

  // If not logged in, render the authentic Bank Login Page with smooth animated transition
  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AnimatePresence>
          {isLoggingIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#07172C]/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4"
            >
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-sm tracking-wide">Establishing 256-Bit Encrypted Banking Session...</p>
              <p className="text-xs text-blue-200">Verifying 2FA Credentials & CBS Ledger Sync</p>
            </motion.div>
          )}
        </AnimatePresence>

        <LoginPage
          users={users}
          admins={admins}
          onLoginCustomer={handleLoginCustomer}
          onLoginAdmin={handleLoginAdmin}
          onOpenGemini={() => setIsGeminiAssistantOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <GeminiAssistantModal
          isOpen={isGeminiAssistantOpen}
          onClose={() => setIsGeminiAssistantOpen(false)}
          currentView="USER"
          currentUser={users[0] || INITIAL_USERS[0]}
          currentAdmin={admins[0] || INITIAL_ADMINS[0]}
          cards={cards}
          transactions={transactions}
        />
      </div>
    );
  }

  const userCards = cards.filter((c) => c.userId === currentUser.id);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070E1E] text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between selection:bg-[#FFB800] selection:text-[#003B6F] transition-colors">
        {/* Animated Logout State Overlay */}
        <AnimatePresence>
          {isLoggingOut && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#07172C]/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4"
            >
              <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-sm tracking-wide">Terminating SRSADMIN Secure Session...</p>
              <p className="text-xs text-slate-300">Flushing active credentials and clearing cache</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          {/* Navigation Bar */}
          <Navbar
            currentView={currentView}
            currentUser={currentUser}
            currentAdmin={currentAdmin}
            onSwitchView={(view) => setCurrentView(view)}
            onLogout={handleLogout}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            isAdminAuthenticated={isAdminAuthenticated}
            onOpenGemini={() => setIsGeminiAssistantOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 right-4 z-50 max-w-md bg-white dark:bg-slate-900 border-2 border-[#004B87] dark:border-blue-500 rounded-2xl shadow-xl p-4 flex items-start gap-3"
              >
                <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#004B87] dark:text-blue-400">
                  <Info className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {toastMessage.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {toastMessage.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Workspace Container */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {currentView === 'ADMIN' ? (
              <AdminPortal
                cards={cards}
                users={users}
                admins={admins}
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
                onOpenEditCardModal={(card) => {
                  setSelectedCardToEdit(card);
                  setIsEditCardModalOpen(true);
                }}
                onOpenKycModal={(user) => {
                  setSelectedCustomerForKyc(user);
                  setIsKycModalOpen(true);
                }}
                onAddAdmin={handleAddAdmin}
                onDeleteAdmin={handleDeleteAdmin}
                onSwitchAdmin={handleSwitchAdmin}
                onResetDemoData={handleResetDemoData}
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
                onSwitchToAdminView={() => setCurrentView('ADMIN')}
                onOpenGemini={() => setIsGeminiAssistantOpen(true)}
                onClearPassbook={handleClearPassbook}
                onOpenRazorpaySimulator={() => {
                  setPreselectedCardForRazorpay(userCards[0] || null);
                  setIsRazorpayModalOpen(true);
                }}
              />
            )}
          </main>
        </div>

        {/* Global Bank Footer */}
        <footer className="bg-[#0B192C] text-slate-400 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CanaraLogo size="sm" showSubtitle={false} />
              <div className="text-left">
                <p className="text-white font-bold text-xs">SRSADMIN बैंक • SRSADMIN BANK LIMITED</p>
                <p className="text-[10px] text-slate-400">Head Office: 112, J.C. Road, Bengaluru - 560002, Karnataka, India</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-Bit SSL / TLS Bank Encryption
              </span>
              <span>•</span>
              <span className="text-slate-300">DICGC Insured up to ₹5,00,000</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleResetDemoData('CLEAN_DEFAULT')}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                title="Reset sample accounts and transactions to initial baseline"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Demo Data
              </button>
            </div>
          </div>
        </footer>

        {/* Floating Mascot Button */}
        <ShristiFloatingMascot 
          onClick={() => setIsGeminiAssistantOpen(true)}
          isOpen={isGeminiAssistantOpen}
        />

        {/* ========================================================================= */}
        {/* MODALS */}
        {/* ========================================================================= */}

        {/* 1. Open Account Modal */}
        <OpenAccountModal
          isOpen={isOpenAccountModalOpen}
          onClose={() => setIsOpenAccountModalOpen(false)}
          onAccountCreated={handleAccountCreated}
          currentAdmin={currentAdmin}
          existingUsers={users}
        />

        {/* 2. Balance Adjustment Modal */}
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

        {/* 3. Edit Customer Modal */}
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

        {/* 4. Edit Cardholder & Assignment Modal */}
        {selectedCardToEdit && (
          <EditCardModal
            isOpen={isEditCardModalOpen}
            onClose={() => {
              setIsEditCardModalOpen(false);
              setSelectedCardToEdit(null);
            }}
            card={selectedCardToEdit}
            users={users}
            currentAdmin={currentAdmin}
            onSaveCard={handleSaveEditedCard}
          />
        )}

        {/* 5. KYC Simulation Modal */}
        {selectedCustomerForKyc && (
          <KycSimulationModal
            isOpen={isKycModalOpen}
            onClose={() => {
              setIsKycModalOpen(false);
              setSelectedCustomerForKyc(null);
            }}
            customer={selectedCustomerForKyc}
            currentAdmin={currentAdmin}
            onKycVerified={handleKycVerified}
          />
        )}

        {/* 6. Issue Card Modal */}
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

        {/* 7. Transfer Modal */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          currentUser={currentUser}
          allUsers={users}
          userCards={userCards}
          onExecuteTransfer={handleExecuteTransfer}
          onOpenRazorpaySimulator={() => {
            setIsTransferModalOpen(false);
            setPreselectedCardForRazorpay(userCards[0] || null);
            setIsRazorpayModalOpen(true);
          }}
        />

        {/* 8. Card Details Modal */}
        <CardDetailsModal
          card={selectedCardForDetails}
          isOpen={!!selectedCardForDetails}
          onClose={() => setSelectedCardForDetails(null)}
          onUpdateStatus={handleUpdateCardStatus}
          onSimulateTransaction={handleSimulateTransaction}
          onOpenRazorpaySimulator={(card) => {
            setPreselectedCardForRazorpay(card || null);
            setIsRazorpayModalOpen(true);
          }}
        />

        {/* 9. Gemini Shristi Assistant Modal */}
        <GeminiAssistantModal
          isOpen={isGeminiAssistantOpen}
          onClose={() => setIsGeminiAssistantOpen(false)}
          currentView={currentView}
          currentUser={currentUser}
          currentAdmin={currentAdmin}
          cards={cards}
          transactions={transactions}
        />

        {/* 10. Razorpay Style Test Gateway Simulator Modal */}
        <RazorpaySimulatorModal
          isOpen={isRazorpayModalOpen}
          onClose={() => {
            setIsRazorpayModalOpen(false);
            setPreselectedCardForRazorpay(null);
          }}
          currentUser={currentUser}
          userCards={userCards}
          onPaymentSuccess={handleRazorpayPaymentSuccess}
        />
      </div>
    </div>
  );
}
