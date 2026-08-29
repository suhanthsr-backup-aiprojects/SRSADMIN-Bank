import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  X, 
  Clock, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  ShoppingBag, 
  Mail, 
  ExternalLink,
  HelpCircle,
  ChevronRight,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Card, UserAccount, Transaction } from '../types';
import { formatCurrency, maskCardNumber, generateCanaraUtrNumber } from '../utils/bankUtils';
import { CanaraLogo } from './CanaraLogo';
import { VisaLogo } from './VisaLogo';

interface RazorpaySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  userCards: Card[];
  onPaymentSuccess: (newTx: Transaction, updatedBalance: number, updatedCard?: Card) => void;
}

type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING';
type Step = 'RAZORPAY_CHECKOUT' | 'REDIRECTING_TO_VISA' | 'VISA_SECURE_PAGE' | 'PROCESSING' | 'SUCCESS';

export const RazorpaySimulatorModal: React.FC<RazorpaySimulatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userCards,
  onPaymentSuccess,
}) => {
  // Merchant details
  const [merchantName, setMerchantName] = useState('Flipkart Internet Private Ltd');
  const [orderAmount, setOrderAmount] = useState<number>(2499);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD');
  
  // Card state
  const [selectedCardId, setSelectedCardId] = useState<string>(userCards[0]?.id || '');
  const [manualCardNumber, setManualCardNumber] = useState('');
  const [manualCardExpiry, setManualCardExpiry] = useState('');
  const [manualCardCvv, setManualCardCvv] = useState('');
  const [isManualCard, setIsManualCard] = useState(false);

  // Email for OTP Delivery
  const [recipientEmail, setRecipientEmail] = useState<string>(currentUser.email || 'mssgeethu6@gmail.com');

  // UPI state
  const [upiId, setUpiId] = useState(`${currentUser.username || 'user'}@srsadmin`);

  // Checkout flow step
  const [step, setStep] = useState<Step>('RAZORPAY_CHECKOUT');
  const [otpId, setOtpId] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [maskedPhone, setMaskedPhone] = useState<string>('+91 ••••• •8841');
  const [maskedEmail, setMaskedEmail] = useState<string>('m••••u6@gmail.com');
  const [referenceNumber, setReferenceNumber] = useState<string>('VISA-3DS-892182');
  const [deliveryMode, setDeliveryMode] = useState<string>('LIVE_GMAIL_SMTP');
  const [otpTimer, setOtpTimer] = useState<number>(180);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Sync default card if userCards change
  useEffect(() => {
    if (userCards.length > 0 && !selectedCardId) {
      setSelectedCardId(userCards[0].id);
    }
  }, [userCards, selectedCardId]);

  // Sync default email
  useEffect(() => {
    if (currentUser.email) {
      setRecipientEmail(currentUser.email);
    }
  }, [currentUser.email]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'VISA_SECURE_PAGE' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const selectedCard = userCards.find((c) => c.id === selectedCardId);

  const handleResetModal = () => {
    setStep('RAZORPAY_CHECKOUT');
    setOtpInput('');
    setErrorMessage(null);
    setSuccessTx(null);
    setOtpTimer(180);
    setResendSuccess(false);
    onClose();
  };

  const handleInitiatePayment = async () => {
    setErrorMessage(null);

    if (orderAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (selectedMethod === 'CARD') {
      let cardNum = '';
      if (isManualCard) {
        if (!manualCardNumber || manualCardNumber.replace(/\s+/g, '').length < 15) {
          setErrorMessage('Please enter a valid 16-digit card number.');
          return;
        }
        if (!manualCardCvv || manualCardCvv.length < 3) {
          setErrorMessage('Please enter valid 3-digit CVV.');
          return;
        }
        cardNum = manualCardNumber;
      } else {
        if (!selectedCard) {
          setErrorMessage('Please select a valid SRSADMIN card.');
          return;
        }
        if (selectedCard.status !== 'ACTIVE') {
          setErrorMessage(`Card is ${selectedCard.status}. Please unlock card before attempting online payment.`);
          return;
        }
        cardNum = selectedCard.cardNumber;
      }

      // Step 1: Transition to Visa Secure Redirection Interstitial
      setStep('REDIRECTING_TO_VISA');

      try {
        // Call backend OTP generation endpoint which dispatches Visa Secure OTP via Gmail SMTP
        const res = await fetch('/api/payment/generate-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardNumber: cardNum,
            amount: orderAmount,
            merchantName,
            customerPhone: currentUser.phone || '8841',
            customerEmail: recipientEmail.trim() || 'mssgeethu6@gmail.com',
            cardholderName: selectedCard?.cardholderName || currentUser.name,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to initialize Visa Secure session.');
        }

        setOtpId(data.otpId);
        setDemoOtp(data.demoOtp);
        setReferenceNumber(data.referenceNumber || `VISA-3DS-${Math.floor(100000 + Math.random() * 900000)}`);
        setMaskedPhone(data.maskedPhone || '+91 ••••• •8841');
        setMaskedEmail(data.maskedEmail || recipientEmail || 'mssgeethu6@gmail.com');
        setDeliveryMode(data.deliveryMode || 'LIVE_GMAIL_SMTP');
        setOtpTimer(180);

        // Smooth simulated redirect delay to mimic real bank gateway handoff
        setTimeout(() => {
          setStep('VISA_SECURE_PAGE');
        }, 1200);
      } catch (err: any) {
        setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
        setStep('RAZORPAY_CHECKOUT');
      }
    } else if (selectedMethod === 'UPI' || selectedMethod === 'NETBANKING') {
      // Direct NetBanking / UPI instant authorization flow
      if (currentUser.balance < orderAmount) {
        setErrorMessage(`Insufficient balance in SRSADMIN Account (Available: ${formatCurrency(currentUser.balance)}).`);
        return;
      }

      setStep('PROCESSING');
      setTimeout(() => {
        const utr = generateCanaraUtrNumber(selectedMethod === 'UPI' ? 'UPI' : 'IMPS');
        const now = new Date();
        const tx: Transaction = {
          id: `tx_${Date.now().toString(36)}_rzp`,
          accountId: currentUser.id,
          accountNumber: currentUser.accountNumber,
          amount: orderAmount,
          type: 'DEBIT',
          category: selectedMethod === 'UPI' ? 'UPI' : 'MERCHANT',
          mode: selectedMethod === 'UPI' ? 'UPI' : 'IMPS',
          merchantName: `${merchantName} (Razorpay Online Checkout)`,
          merchantCategory: 'E-Commerce / Online Services',
          status: 'COMPLETED',
          timestamp: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          referenceNumber: utr,
          notes: `Simulated checkout via Razorpay Gateway (${selectedMethod})`,
        };

        const updatedBal = currentUser.balance - orderAmount;
        setSuccessTx(tx);
        setStep('SUCCESS');
        onPaymentSuccess(tx, updatedBal);
      }, 900);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setErrorMessage(null);

    try {
      const cardNum = isManualCard ? manualCardNumber : (selectedCard?.cardNumber || '');
      const res = await fetch('/api/payment/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardNum,
          amount: orderAmount,
          merchantName,
          customerPhone: currentUser.phone || '8841',
          customerEmail: recipientEmail.trim() || 'mssgeethu6@gmail.com',
          cardholderName: selectedCard?.cardholderName || currentUser.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpId(data.otpId);
        setDemoOtp(data.demoOtp);
        setOtpTimer(180);
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 4000);
      }
    } catch {
      setErrorMessage('Unable to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtpAndPay = async () => {
    setErrorMessage(null);
    if (!otpInput || otpInput.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP received in your email.');
      return;
    }

    setStep('PROCESSING');

    try {
      const cardNum = isManualCard ? manualCardNumber : (selectedCard?.cardNumber || '');
      const res = await fetch('/api/payment/verify-and-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpId,
          otp: otpInput.trim(),
          cardNumber: cardNum,
          amount: orderAmount,
          merchantName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Visa Secure Authentication failed. Please verify your OTP.');
      }

      let updatedCard: Card | undefined = undefined;
      let newBalance = currentUser.balance;

      if (!isManualCard && selectedCard) {
        if (selectedCard.type === 'CREDIT') {
          if (selectedCard.usedLimit + orderAmount > selectedCard.creditLimit) {
            throw new Error('Transaction declined: Credit limit exceeded on selected card.');
          }
          updatedCard = {
            ...selectedCard,
            usedLimit: selectedCard.usedLimit + orderAmount,
          };
        } else {
          if (currentUser.balance < orderAmount) {
            throw new Error('Transaction declined: Insufficient funds in linked SRSADMIN Savings Account.');
          }
          newBalance = currentUser.balance - orderAmount;
        }
      } else {
        newBalance = Math.max(0, currentUser.balance - orderAmount);
      }

      const tx: Transaction = {
        id: `tx_${Date.now().toString(36)}_rzp`,
        cardId: selectedCard?.id,
        accountId: currentUser.id,
        accountNumber: currentUser.accountNumber,
        amount: orderAmount,
        type: 'DEBIT',
        category: 'POS_PURCHASE',
        mode: 'RUPAY_POS',
        merchantName: `${merchantName} (Visa Secure 3D-Secure)`,
        merchantCategory: 'E-Commerce / Online Services',
        status: 'COMPLETED',
        timestamp: data.timestamp || `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        referenceNumber: data.referenceNumber,
        cardLast4: cardNum.replace(/\s+/g, '').slice(-4),
        notes: `Authenticated via Visa Secure 3D-Secure 2.0 ACS with Email OTP`,
      };

      setSuccessTx(tx);
      setStep('SUCCESS');
      onPaymentSuccess(tx, newBalance, updatedCard);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment authorization failed.');
      setStep('VISA_SECURE_PAGE');
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handleDownloadInvoice = () => {
    if (!successTx) return;
    const text = `========================================================================
VISA SECURE / VERIFIED BY VISA - TRANSACTION AUTHORIZATION RECEIPT
SRSADMIN बैंक (SRSADMIN BANK) 3D-SECURE 2.0 CLEARING
========================================================================
Receipt ID      : VISA_SECURE_${successTx.id.toUpperCase()}
Bank UTR / Ref  : ${successTx.referenceNumber}
Merchant        : ${merchantName}
Amount Paid     : ${formatCurrency(successTx.amount)}
Payment Channel : VISA 3D-Secure ACS (Card Ending •••• ${successTx.cardLast4 || '4892'})
Payer Name      : ${currentUser.name}
Payer Account   : ${currentUser.accountNumber} (CIF: ${currentUser.cifNumber})
Status          : SUCCESSFUL / AUTHORIZED
Auth Timestamp  : ${successTx.timestamp} IST
========================================================================
This is an authentic simulated Visa Secure payment clearing receipt for SRSADMIN Core Banking.`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VisaSecure_Receipt_${successTx.referenceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0B132B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* =========================================================================
            TOP HEADER (Dynamically switches between Razorpay and Visa Secure)
        ========================================================================= */}
        {step === 'VISA_SECURE_PAGE' ? (
          /* Official Visa Secure Header */
          <div className="bg-[#1A1F71] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#F7B600] shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm">
                <VisaLogo size="sm" variant="secure" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                    <span>Visa Secure</span>
                    <span className="text-[10px] font-mono bg-[#F7B600] text-[#1A1F71] font-black px-1.5 py-0.2 rounded">
                      ACS 2.0
                    </span>
                  </span>
                </div>
                <p className="text-[11px] text-blue-200">
                  SRSADMIN Bank 3D-Secure Authentication Service
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-blue-200 uppercase block font-semibold">Amount</span>
                <span className="text-sm font-black text-[#F7B600] font-mono">{formatCurrency(orderAmount)}</span>
              </div>
              <button
                type="button"
                id="cancel-visa-header-btn"
                onClick={() => {
                  setStep('RAZORPAY_CHECKOUT');
                  setErrorMessage(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition-colors cursor-pointer"
                title="Cancel and return to checkout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Razorpay Standard Brand Header Banner */
          <div className="bg-gradient-to-r from-[#0c2340] via-[#021c3b] to-[#001730] p-4 sm:p-5 text-white flex items-center justify-between border-b border-blue-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-black">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    Razorpay <span className="text-blue-400 font-mono text-xs px-1.5 py-0.5 rounded bg-blue-900/60 border border-blue-500/30">CHECKOUT</span>
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-300" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{merchantName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-blue-300 uppercase block font-semibold">Amount to Pay</span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{formatCurrency(orderAmount)}</span>
              </div>
              <button
                type="button"
                id="close-razorpay-modal"
                onClick={handleResetModal}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
          
          {/* =========================================================================
              STEP 1: RAZORPAY CHECKOUT SCREEN (Details & Method Selection)
          ========================================================================= */}
          {step === 'RAZORPAY_CHECKOUT' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Preset Amount & Merchant Selector */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Order Checkout Parameters:</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Merchant
                    </label>
                    <select
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Flipkart Internet Private Ltd">Flipkart Online Retail</option>
                      <option value="Amazon India Payments">Amazon Pay India</option>
                      <option value="Swiggy Food & Instamart">Swiggy Delivery</option>
                      <option value="BookMyShow Tickets">BookMyShow Entertainment</option>
                      <option value="Bharat Petroleum E-Fuel">Bharat Petroleum (POS)</option>
                      <option value="MakeMyTrip Travels">MakeMyTrip Flight Booking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Recipient Email for OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Destination Email for Visa Secure OTP
                    </label>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                      Gmail SMTP Dispatch
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. mssgeethu6@gmail.com"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Payment Option:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CARD')}
                    className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'CARD'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#1A1F71] dark:text-blue-400" />
                    <span>Visa / Debit / Credit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI')}
                    className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'UPI'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('NETBANKING')}
                    className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === 'NETBANKING'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>NetBanking</span>
                  </button>
                </div>
              </div>

              {/* CARD DETAILS SELECTION */}
              {selectedMethod === 'CARD' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Select Bank Card:</span>
                      <span className="text-[10px] font-normal text-slate-500">Redirects to Visa Secure</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualCard(!isManualCard)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {isManualCard ? '← Select Saved SRSADMIN Card' : '+ Enter Other Card'}
                    </button>
                  </div>

                  {!isManualCard ? (
                    <div className="space-y-2">
                      {userCards.map((card) => {
                        const isSelected = selectedCardId === card.id;
                        return (
                          <div
                            key={card.id}
                            onClick={() => setSelectedCardId(card.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-[#1A1F71] dark:border-blue-500 ring-2 ring-blue-500/20'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-7 rounded-lg bg-[#1A1F71] text-white flex items-center justify-center font-mono text-[10px] font-black shadow-xs">
                                {card.network === 'VISA' ? 'VISA' : card.network}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                    {maskCardNumber(card.cardNumber)}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                                    {card.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Exp: {card.expiryMonth}/{card.expiryYear} • {card.cardholderName}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                {card.type === 'CREDIT' 
                                  ? `Avail: ${formatCurrency(card.creditLimit - card.usedLimit)}`
                                  : `Bal: ${formatCurrency(currentUser.balance)}`
                                }
                              </div>
                              <span className={`text-[10px] font-bold ${card.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                {card.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4532 9012 4491 3820"
                          maxLength={19}
                          value={manualCardNumber}
                          onChange={(e) => setManualCardNumber(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="08/30"
                            maxLength={5}
                            value={manualCardExpiry}
                            onChange={(e) => setManualCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="842"
                            maxLength={4}
                            value={manualCardCvv}
                            onChange={(e) => setManualCardCvv(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UPI DETAILS */}
              {selectedMethod === 'UPI' && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Enter UPI ID / VPA:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@srsadmin"
                        className="flex-1 px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <QrCode className="w-4 h-4 text-slate-400" />
                      <span>Direct instant authorization linked to SRSADMIN SB A/c #{currentUser.accountNumber.slice(-4)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* NETBANKING DETAILS */}
              {selectedMethod === 'NETBANKING' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <CanaraLogo size="sm" showSubtitle={false} />
                    <div>
                      <h4 className="font-bold text-xs text-[#004B87] dark:text-blue-400">SRSADMIN Bank NetBanking Gateway</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Authorized User: {currentUser.name} • A/c: {currentUser.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
                    <span>Available SB Balance:</span>
                    <strong className="font-mono">{formatCurrency(currentUser.balance)}</strong>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                id="initiate-razorpay-btn"
                onClick={handleInitiatePayment}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003866] text-white font-extrabold text-sm shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed & Pay {formatCurrency(orderAmount)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Redirects to Visa Secure 3D-Secure 2.0 ACS with Email OTP</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: REDIRECTING TO VISA SECURE INTERSTITIAL
          ========================================================================= */}
          {step === 'REDIRECTING_TO_VISA' && (
            <div className="py-14 text-center space-y-5 animate-in fade-in duration-200">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-blue-200 dark:border-blue-950 border-t-[#1A1F71] dark:border-t-[#F7B600] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#1A1F71] dark:text-[#F7B600]" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-2 bg-[#1A1F71]/10 dark:bg-blue-950 px-3 py-1 rounded-full text-xs font-bold text-[#1A1F71] dark:text-blue-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verified by Visa (3D-Secure 2.0)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Redirecting to Visa Secure...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Connecting to SRSADMIN Bank Access Control Server (ACS) and generating transaction OTP to <strong className="text-slate-800 dark:text-slate-200">{recipientEmail}</strong>.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 font-mono">
                acs.srsadminbank.in/visa-secure/auth
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: AUTHENTIC VISA SECURE TRANSACTION PAGE (EMAIL OTP VERIFICATION)
          ========================================================================= */}
          {step === 'VISA_SECURE_PAGE' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Visa Secure Brand Sub-Header Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1A1F71] to-[#0A0E3F] text-white flex items-center justify-between border border-[#F7B600]/40 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs">
                    <span className="font-serif italic font-black text-[#1A1F71] text-xs">VISA</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">
                      Verified by Visa (3D-Secure 2.0)
                    </h4>
                    <span className="text-[10px] text-blue-200 font-mono">
                      Ref: {referenceNumber}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-blue-200 block">OTP Valid For</span>
                  <span className="font-mono text-xs font-black text-[#F7B600] flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Transaction Summary Table (Standard Visa Secure Layout) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Transaction Summary</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit TLS Bank Switch
                  </span>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Merchant Name:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{merchantName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Transaction Amount:</span>
                    <strong className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(orderAmount)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Card Number:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {isManualCard ? maskCardNumber(manualCardNumber || '4532901244913820') : (selectedCard ? maskCardNumber(selectedCard.cardNumber) : '•••• •••• •••• 4892')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                  </div>
                </div>
              </div>

              {/* Email OTP Delivery Notice Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1A1F71] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#F7B600]" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#1A1F71] dark:text-blue-300 block">
                      OTP Sent to Your Registered Email
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {maskedEmail}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-10">
                  Please check your Gmail inbox or Updates folder for the official <strong>Visa Secure One-Time Password</strong>.
                </p>

                {deliveryMode === 'LIVE_GMAIL_SMTP' && (
                  <div className="pl-10 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live Gmail SMTP Transmission Dispatched</span>
                  </div>
                )}
              </div>

              {/* Test Simulation Helper Pill for easy verification */}
              {demoOtp && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Emailed OTP Code: <strong className="font-mono text-slate-950 dark:text-white text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-300">{demoOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(demoOtp)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Autofill
                  </button>
                </div>
              )}

              {resendSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>A fresh Visa Secure OTP email has been dispatched to {maskedEmail}!</span>
                </div>
              )}

              {/* 6-Digit OTP Entry Input */}
              <div className="space-y-2">
                <label className="block text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                  Enter 6-Digit Visa Secure OTP:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    id="visa-otp-input"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.6em] font-mono text-2xl font-black py-3.5 rounded-2xl border-2 border-[#1A1F71]/50 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A1F71] focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resend & Cancel actions */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('RAZORPAY_CHECKOUT');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel Transaction</span>
                </button>

                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendOtp}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend OTP to Email</span>
                    </>
                  )}
                </button>
              </div>

              {/* Primary Visa Secure Submit Button */}
              <button
                type="button"
                id="submit-visa-otp-btn"
                onClick={handleVerifyOtpAndPay}
                className="w-full py-4 px-4 rounded-2xl bg-[#1A1F71] hover:bg-[#121650] text-white font-black text-sm shadow-xl hover:shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#F7B600]/50"
              >
                <ShieldCheck className="w-5 h-5 text-[#F7B600]" />
                <span>CONFIRM & AUTHORIZE PAYMENT ({formatCurrency(orderAmount)})</span>
              </button>

              <p className="text-center text-[10px] text-slate-400">
                SRSADMIN Bank 24x7 Cyber Assistance: 1800 425 0018 • Never share OTP with anyone
              </p>
            </div>
          )}

          {/* =========================================================================
              STEP 4: PROCESSING OVERLAY
          ========================================================================= */}
          {step === 'PROCESSING' && (
            <div className="py-14 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-[#1A1F71] dark:border-t-[#F7B600] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#1A1F71] dark:text-[#F7B600]" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Authenticating with Visa Directory Server...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verifying OTP and executing settlement with SRSADMIN Bank Core Banking Switch. Please do not close or refresh.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 5: SUCCESS RECEIPT
          ========================================================================= */}
          {step === 'SUCCESS' && successTx && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Visa Secure 3D-Secure 2.0 Authenticated</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Payment Authorized!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transaction successfully completed and synchronized with your SRSADMIN bank account.
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Amount Paid:</span>
                  <strong className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(successTx.amount)}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Merchant:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{merchantName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank UTR / Ref:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                    <span>{successTx.referenceNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyUtr(successTx.referenceNumber)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy UTR"
                    >
                      {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Auth Method:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    VISA 3D-Secure 2.0 ACS
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">{successTx.timestamp} IST</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetModal}
                  className="py-3 px-3 rounded-2xl bg-[#004B87] hover:bg-[#003866] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  <span>Done / Back to Portal</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
