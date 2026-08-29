import { CardNetwork, CardType } from '../types';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR' || currency === '₹') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const maskCardNumber = (cardNumber: string, visibleDigits: number = 4): string => {
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 8) return cardNumber;
  const lastDigits = clean.slice(-visibleDigits);
  if (clean.length === 15) {
    return `•••• •••••• •${lastDigits}`;
  }
  return `•••• •••• •••• ${lastDigits}`;
};

export const formatCardNumberSpacing = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('34') || digits.startsWith('37')) {
    const parts = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean);
    return parts.join(' ');
  }
  const matches = digits.match(/.{1,4}/g);
  return matches ? matches.join(' ') : digits;
};

export const generateCardNumber = (network: CardNetwork): string => {
  let prefix = '6521'; // RuPay Default
  let length = 16;

  if (network === 'RUPAY') {
    const prefixes = ['6521', '6071', '6080', '6522'];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    length = 16;
  } else if (network === 'VISA') {
    const prefixes = ['4532', '4111', '4916', '4024'];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    length = 16;
  } else if (network === 'MASTERCARD') {
    const prefixes = ['5412', '5105', '5521', '5230'];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    length = 16;
  } else if (network === 'AMEX') {
    const prefixes = ['3782', '3714', '3401'];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    length = 15;
  }

  let remainingLength = length - prefix.length;
  let remainingDigits = '';
  for (let i = 0; i < remainingLength; i++) {
    remainingDigits += Math.floor(Math.random() * 10).toString();
  }

  return formatCardNumberSpacing(prefix + remainingDigits);
};

export const generateCVV = (network: CardNetwork): string => {
  if (network === 'AMEX') {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  return Math.floor(100 + Math.random() * 900).toString();
};

export const generatePIN = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const generateSrsAccountNumber = (): string => {
  const branchPrefix = '0210';
  const mid = '1010';
  const last5 = Math.floor(10000 + Math.random() * 90000).toString();
  return `${branchPrefix}${mid}${last5}`;
};

export const generateCanaraAccountNumber = generateSrsAccountNumber;

export const generateCIF = (): string => {
  return Math.floor(80000000000 + Math.random() * 19999999999).toString();
};

export const generateCifNumber = generateCIF;

export const generateReferenceId = (prefix: string = 'SRSA'): string => {
  const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dateNum = Math.floor(Math.random() * 90000 + 10000);
  return `${prefix}-UTR-${dateNum}${randomHex}`;
};

export const generateSrsUtrNumber = (mode: string = 'IMPS'): string => {
  const yearDigit = '26';
  const dayOfYear = String(Math.floor(Math.random() * 365) + 1).padStart(3, '0');
  const randomSeq = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `SRSA${mode.slice(0, 1)}${yearDigit}${dayOfYear}${randomSeq}`;
};

export const generateCanaraUtrNumber = generateSrsUtrNumber;

export const SRS_BRANCHES = [
  { code: '0002', name: 'Bengaluru Main Branch (0002)', ifsc: 'SRSA0000002', micr: '560015002', city: 'Bengaluru, KA' },
  { code: '0123', name: 'Connaught Circus Branch (0123)', ifsc: 'SRSA0000123', micr: '110015012', city: 'New Delhi, DL' },
  { code: '0210', name: 'Mumbai Fort Nariman Point (0210)', ifsc: 'SRSA0000210', micr: '400015021', city: 'Mumbai, MH' },
  { code: '0334', name: 'Chennai Mount Road (0334)', ifsc: 'SRSA0000334', micr: '600015033', city: 'Chennai, TN' },
  { code: '0112', name: 'Hyderabad Abids Branch (0112)', ifsc: 'SRSA0000112', micr: '500015011', city: 'Hyderabad, TS' },
  { code: '0455', name: 'Kolkata BBD Bagh (0455)', ifsc: 'SRSA0000455', micr: '700015045', city: 'Kolkata, WB' },
];

export const CANARA_BRANCHES = SRS_BRANCHES;
