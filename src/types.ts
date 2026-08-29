export type CardType = 'DEBIT' | 'CREDIT';

export type CardTier =
  | 'RUPAY_PLATINUM'
  | 'RUPAY_SELECT'
  | 'VISA_SIGNATURE'
  | 'MASTERCARD_WORLD'
  | 'BHARAT_CORPORATE_GOLD'
  | 'PLATINUM'
  | 'CLASSIC'
  | 'TITANIUM_BLACK';

export type CardNetwork = 'RUPAY' | 'VISA' | 'MASTERCARD' | 'AMEX';

export type CardStatus = 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'PENDING_PIN' | 'EXPIRED';

export type CardTheme =
  | 'srs-signature-blue'
  | 'srs-gold-rupay'
  | 'srs-emerald-select'
  | 'srs-sovereign-navy'
  | 'canara-signature-blue'
  | 'canara-gold-rupay'
  | 'canara-emerald-select'
  | 'canara-sovereign-navy'
  | 'midnight-navy'
  | 'brushed-titanium'
  | 'emerald-prestige'
  | 'royal-obsidian';

export interface Card {
  id: string;
  cardNumber: string;
  cardholderName: string;
  userId: string;
  type: CardType;
  tier: CardTier;
  network: CardNetwork;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin: string;
  status: CardStatus;
  theme: CardTheme;
  balance?: number; // for Debit cards
  creditLimit: number; // for Credit cards
  usedLimit: number; // for Credit cards
  dailyAtmLimit: number;
  dailyPosLimit?: number;
  dailyOnlineLimit?: number;
  onlinePurchasesEnabled?: boolean;
  internationalUsage?: boolean;
  contactlessEnabled?: boolean;
  allowOnline?: boolean;
  allowInternational?: boolean;
  allowContactless?: boolean;
  allowAtm?: boolean;
  issuedByAdminId: string;
  issuedByAdminName: string;
  issuedDate: string;
  accountId?: string;
  billingCycleDay?: number;
  apr?: number;
  cardNickname?: string;
  cvvGenerated?: boolean;
}

export interface UserAccount {
  id: string;
  cifNumber: string; // SRSADMIN Customer Information File No. (e.g. 84920194821)
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  accountNumber: string; // e.g. 0210101004892 (13-digit standard SRSADMIN SB account)
  accountType: 'SAVINGS' | 'CHECKING' | 'CORPORATE_CURRENT' | 'CANARA_PREMIUM_SB' | 'SRS_PREMIUM_SB' | 'FIXED_DEPOSIT';
  ifscCode: string; // e.g. SRSA0000002
  branchName: string; // e.g. Bengaluru Main Branch (0002)
  micrCode: string; // e.g. 560015002
  upiId?: string; // e.g. marcus@srsadmin or username@srsadmin
  panNumber: string; // e.g. ABCDE1234F
  aadhaarLast4: string; // e.g. 8841
  balance: number;
  currency: string; // default INR
  kycStatus: 'VERIFIED' | 'PENDING' | 'DOCUMENT_REQUIRED';
  accountStatus: 'ACTIVE' | 'FROZEN' | 'RESTRICTED' | 'SUSPENDED';
  joinedDate: string;
  createdAt?: string;
  address: string;
  nomineeName?: string;
  companyName?: string;
  profileRole?: string;
  taxId?: string;
  dob?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  employeeId: string; // e.g. SRS-EMP-78401
  role: 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'SENIOR_CARD_ISSUER' | 'COMPLIANCE_OFFICER' | 'TREASURY_LEAD';
  department: string;
  branchCode: string; // e.g. 0002 - Bengaluru Town Hall
  lastLogin: string;
  badgeLevel: string;
  avatarInitials: string;
}

export interface Transaction {
  id: string;
  cardId?: string;
  accountId: string;
  accountNumber?: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category: 
    | 'UPI'
    | 'IMPS'
    | 'NEFT'
    | 'RTGS'
    | 'MERCHANT'
    | 'POS_PURCHASE'
    | 'ATM_WITHDRAWAL'
    | 'TRANSFER'
    | 'BILL_PAY'
    | 'CARD_ISSUANCE_FEE'
    | 'INTEREST'
    | 'SALARY_DEPOSIT'
    | 'ADMIN_BALANCE_ADJUSTMENT'
    | 'WIRE_DEPOSIT'
    | 'CASH_DEPOSIT';
  merchantName: string;
  merchantCategory: string;
  status: 'COMPLETED' | 'PENDING' | 'FLAGGED' | 'REVERSED';
  timestamp: string;
  referenceNumber: string; // RRN / UTR number (e.g. CNRB2624091823)
  notes?: string;
  cardLast4?: string;
  mode?: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS' | 'BRANCH_CBS' | 'CBS_CLEARING' | 'POS' | 'RUPAY_POS' | 'ATM';
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'CARD' | 'USER' | 'TRANSACTION' | 'SECURITY' | 'ADMIN';
  targetId: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress?: string;
}
