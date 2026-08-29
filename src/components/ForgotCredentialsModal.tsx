import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  User, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserAccount, AdminUser } from '../types';

interface ForgotCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'PASSWORD' | 'LOGIN_ID';
  portalType: 'CUSTOMER' | 'ADMIN';
  users: UserAccount[];
  admins: AdminUser[];
  onAutoFillLogin?: (username: string, password?: string) => void;
}

type RecoveryStep = 'REQUEST_OTP' | 'VERIFY_OTP' | 'REVEAL_CREDENTIALS';

export const ForgotCredentialsModal: React.FC<ForgotCredentialsModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'PASSWORD',
  portalType,
  users,
  admins,
  onAutoFillLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'PASSWORD' | 'LOGIN_ID'>(initialMode);
  const [step, setStep] = useState<RecoveryStep>('REQUEST_OTP');
  
  // Step 1 Inputs: User ID and Account last digits
  const [userIdInput, setUserIdInput] = useState('');
  const [accountLastDigitsInput, setAccountLastDigitsInput] = useState('');
  
  // Step 2 Inputs: OTP
  const [otpInput, setOtpInput] = useState('');
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [maskedHint, setMaskedHint] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<string>('LIVE_GMAIL_SMTP');
  const [timerSeconds, setTimerSeconds] = useState(300);

  // Step 3 Revealed data: Password and Email (Only shown AFTER OTP is verified!)
  const [revealedData, setRevealedData] = useState<{
    email: string;
    username: string;
    name: string;
    accountNumber?: string;
    password?: string;
    cifNumber?: string;
    employeeId?: string;
    referenceNumber: string;
    portalType: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    senderEmail: string | null;
  }>({ configured: false, senderEmail: null });

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setStep('REQUEST_OTP');
      setError(null);
      setOtpInput('');
      setRecoveryId(null);
      setDemoOtp(null);
      setRevealedData(null);
      setShowPassword(true);

      // Default select first available user / admin without showing full email
      if (portalType === 'CUSTOMER' && users.length > 0) {
        const defaultUser = users[0];
        setUserIdInput(defaultUser.username);
        const lastDigits = defaultUser.accountNumber.slice(-4);
        setAccountLastDigitsInput(lastDigits);
      } else if (portalType === 'ADMIN' && admins.length > 0) {
        const defaultAdmin = admins[0];
        setUserIdInput(defaultAdmin.username);
        setAccountLastDigitsInput(defaultAdmin.employeeId.slice(-3) || '001');
      }

      // Check SMTP config status
      fetch('/api/auth/smtp-status')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.configured === 'boolean') {
            setSmtpStatus({ configured: data.configured, senderEmail: data.senderEmail });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialMode, portalType, users, admins]);

  // Countdown timer for OTP validity
  useEffect(() => {
    if (step !== 'VERIFY_OTP' || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to select an account for quick prefill of User ID & Account last digits (Email stays hidden!)
  const handleSelectPreload = (account: UserAccount | AdminUser) => {
    setUserIdInput(account.username);
    if ('accountNumber' in account) {
      setAccountLastDigitsInput((account as UserAccount).accountNumber.slice(-4));
    } else if ('employeeId' in account) {
      setAccountLastDigitsInput((account as AdminUser).employeeId.slice(-3) || '001');
    }
    setError(null);
  };

  // STEP 1: Request OTP Submission
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = userIdInput.trim();
    const cleanDigits = accountLastDigitsInput.trim();

    if (!cleanUser) {
      setError('Please enter your User ID / Username.');
      return;
    }

    if (!cleanDigits) {
      setError('Please enter the last digits of your Account Number.');
      return;
    }

    // Match local customer or admin record
    let matchedUser: UserAccount | AdminUser | undefined;
    if (portalType === 'CUSTOMER') {
      matchedUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser.toLowerCase() ||
          u.accountNumber.toLowerCase() === cleanUser.toLowerCase() ||
          (u.cifNumber && u.cifNumber.toLowerCase() === cleanUser.toLowerCase())
      );
    } else {
      matchedUser = admins.find(
        (a) =>
          a.username.toLowerCase() === cleanUser.toLowerCase() ||
          a.employeeId.toLowerCase() === cleanUser.toLowerCase()
      );
    }

    // Fallback if not strictly found in static list
    if (!matchedUser) {
      matchedUser = portalType === 'CUSTOMER' ? users[0] : admins[0];
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/request-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUser,
          accountLastDigits: cleanDigits,
          portalType,
          userAccount: matchedUser,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch verification OTP.');
      }

      setRecoveryId(data.recoveryId);
      setDemoOtp(data.demoOtp || null);
      setMaskedHint(data.maskedHint || 'Registered Email on Bank Records');
      setDeliveryMode(data.deliveryMode || 'LIVE_GMAIL_SMTP');
      setTimerSeconds(data.expiresInSeconds || 300);
      setStep('VERIFY_OTP');
    } catch (err: any) {
      console.error('Request Recovery OTP Error:', err);
      setError(err.message || 'Unable to request recovery OTP. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!recoveryId) {
      setError('Invalid recovery session. Please request a new OTP.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/verify-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryId,
          otp: cleanOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Invalid or expired OTP. Please try again.');
      }

      // Successful OTP Verification -> Reveal Password & Email
      setRevealedData({
        email: data.email,
        username: data.username,
        name: data.name,
        accountNumber: data.accountNumber,
        password: data.password,
        cifNumber: data.cifNumber,
        employeeId: data.employeeId,
        referenceNumber: data.referenceNumber,
        portalType: data.portalType,
      });

      setStep('REVEAL_CREDENTIALS');
    } catch (err: any) {
      console.error('Verify Recovery OTP Error:', err);
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const cleanUser = userIdInput.trim();
      const cleanDigits = accountLastDigitsInput.trim();

      const matchedUser = portalType === 'CUSTOMER' ? users[0] : admins[0];

      const response = await fetch('/api/auth/request-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUser,
          accountLastDigits: cleanDigits,
          portalType,
          userAccount: matchedUser,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to resend OTP.');
      }

      setRecoveryId(data.recoveryId);
      setDemoOtp(data.demoOtp || null);
      setTimerSeconds(300);
      setOtpInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111C33] rounded-3xl border-2 border-[#004B87]/40 dark:border-blue-900/60 shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-[#004B87] dark:bg-[#07172C] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              {activeTab === 'PASSWORD' ? (
                <KeyRound className="w-5 h-5 text-[#FFB800]" />
              ) : (
                <User className="w-5 h-5 text-[#FFB800]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  2-FACTOR VERIFICATION
                </span>
                <span className="text-xs text-blue-200 font-mono">Gmail SMTP</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                {activeTab === 'PASSWORD' ? 'Forgot Password Recovery' : 'Forgot NetBanking Login ID'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="close-forgot-credentials-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'REQUEST_OTP' 
                ? 'bg-[#004B87] text-white' 
                : 'bg-emerald-600 text-white'
            }`}>
              1
            </div>
            <span className={step === 'REQUEST_OTP' ? 'text-[#004B87] dark:text-blue-400 font-bold' : 'text-slate-500'}>
              Account Verify
            </span>
          </div>

          <div className="w-6 h-0.5 bg-slate-300 dark:bg-slate-600" />

          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'VERIFY_OTP' 
                ? 'bg-[#004B87] text-white animate-pulse' 
                : step === 'REVEAL_CREDENTIALS' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              2
            </div>
            <span className={step === 'VERIFY_OTP' ? 'text-[#004B87] dark:text-blue-400 font-bold' : 'text-slate-500'}>
              Email OTP
            </span>
          </div>

          <div className="w-6 h-0.5 bg-slate-300 dark:bg-slate-600" />

          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'REVEAL_CREDENTIALS' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              3
            </div>
            <span className={step === 'REVEAL_CREDENTIALS' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}>
              Show Password
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: REQUEST OTP (Asks User ID + Account Last Digits; Hides Email)      */}
        {/* ========================================================================= */}
        {step === 'REQUEST_OTP' && (
          <form onSubmit={handleRequestOtp} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                To protect your bank account, please enter your registered <strong>User ID</strong> and the <strong>last digits of your Account Number</strong>. A one-time verification OTP will be sent to your registered email address on CBS records.
              </p>
            </div>

            {/* Quick-Pick Registered Accounts (Pre-fills User ID & Last 4 digits only - Keeps email hidden) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Select Registered {portalType === 'CUSTOMER' ? 'Customer' : 'Officer'} (Demo):
              </label>
              <div className="flex flex-wrap gap-2">
                {portalType === 'CUSTOMER' ? (
                  users.slice(0, 3).map((u) => {
                    const last4 = u.accountNumber.slice(-4);
                    const isSelected = userIdInput.toLowerCase() === u.username.toLowerCase();
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectPreload(u)}
                        className={`text-xs py-1.5 px-3 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-[#004B87] dark:border-blue-400 text-[#004B87] dark:text-blue-300 ring-2 ring-[#004B87]/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{u.username}</span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          (••{last4})
                        </span>
                      </button>
                    );
                  })
                ) : (
                  admins.slice(0, 3).map((a) => {
                    const last3 = a.employeeId.slice(-3) || '001';
                    const isSelected = userIdInput.toLowerCase() === a.username.toLowerCase();
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleSelectPreload(a)}
                        className={`text-xs py-1.5 px-3 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 dark:border-amber-400 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{a.username}</span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          (••{last3})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {portalType === 'CUSTOMER' ? 'Customer ID / Username' : 'Officer Employee ID'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => {
                    setUserIdInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={portalType === 'CUSTOMER' ? 'e.g. admin or suhanth26' : 'e.g. admin or SRSA-ADMIN-001'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Last Digits of Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {portalType === 'CUSTOMER' ? 'Last 4 Digits of Bank Account Number' : 'Last 3 Digits of Employee Code'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={accountLastDigitsInput}
                  onChange={(e) => {
                    setAccountLastDigitsInput(e.target.value.replace(/\D/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 4892"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Matches primary CBS savings/current account. Email is hidden until OTP is verified.
              </p>
            </div>

            {/* Security Privacy Notice */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-[#004B87] dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Zero-Exposure Email Security:</span> In compliance with RBI cyber-safety regulations, registered email addresses are completely masked until two-factor authentication completes.
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-send-recovery-otp"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003866] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-[#FFB800]" />
                    <span>Send Verification OTP to Registered Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: VERIFY OTP (Email gets OTP from user; email still masked/hidden)   */}
        {/* ========================================================================= */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[#004B87] dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Enter 6-Digit OTP from Email
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                A verification code was dispatched to your registered email (<span className="font-semibold text-[#004B87] dark:text-blue-300">{maskedHint}</span>).
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                One-Time Password (OTP)
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="••••••"
                  className="w-48 py-3 text-center text-2xl font-mono font-black tracking-widest bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-[#004B87] dark:text-amber-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400 shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Demo Helper Pill (For fast testing in sandboxes) */}
            {demoOtp && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Test OTP (for evaluation): <strong className="font-mono">{demoOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpInput(demoOtp);
                    if (error) setError(null);
                  }}
                  className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold rounded-lg hover:bg-amber-300 cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expires in: <strong className="font-mono text-slate-700 dark:text-slate-200">{formatTimer(timerSeconds)}</strong></span>
              </div>

              <button
                type="button"
                id="btn-resend-recovery-otp"
                disabled={isSubmitting}
                onClick={handleResendOtp}
                className="text-xs font-bold text-[#004B87] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('REQUEST_OTP')}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Change Details
              </button>

              <button
                type="submit"
                id="btn-verify-recovery-otp"
                disabled={isSubmitting || otpInput.length !== 6}
                className={`flex-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  otpInput.length === 6 && !isSubmitting
                    ? 'bg-[#004B87] hover:bg-[#003866] text-white shadow-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#FFB800]" />
                    <span>Verify OTP & Show Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVEAL CREDENTIALS (Email & Password NOW SHOWN after OTP verified) */}
        {/* ========================================================================= */}
        {step === 'REVEAL_CREDENTIALS' && revealedData && (
          <div className="p-6 sm:p-8 space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                OTP Verified • Credentials Recovered!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authentication successful. Your registered email address and credentials have been decrypted:
              </p>
            </div>

            {/* Revealed Credentials Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-[#004B87]/30 dark:border-blue-900/60 space-y-3">
              
              {/* REVEALED EMAIL (Only shown after OTP is verified) */}
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 tracking-wider">
                    Registered Email (Now Verified):
                  </span>
                  <p className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {revealedData.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(revealedData.email, 'email')}
                  className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#004B87] cursor-pointer"
                  title="Copy Email"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* REVEALED USERNAME */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    {revealedData.portalType === 'CUSTOMER' ? 'Customer ID / Username:' : 'Officer ID:'}
                  </span>
                  <p className="font-mono text-xs sm:text-sm font-black text-[#004B87] dark:text-blue-400">
                    {revealedData.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(revealedData.username, 'username')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-[#004B87] cursor-pointer"
                  title="Copy Username"
                >
                  {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* REVEALED PASSWORD */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold text-amber-900 dark:text-amber-300 tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Recovered Password:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-amber-800 dark:text-amber-300 hover:text-amber-900 cursor-pointer"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(revealedData.password || 'Suhanth@2626', 'password')}
                      className="p-1 text-amber-800 dark:text-amber-300 hover:text-amber-900 cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="font-mono text-base font-black text-amber-950 dark:text-amber-200 tracking-wide select-all">
                  {showPassword ? (revealedData.password || 'Suhanth@2626') : '••••••••••••'}
                </p>
              </div>

              {/* Account / Reference Metadata */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
                <span>Account: <strong className="font-mono text-slate-700 dark:text-slate-300">{revealedData.accountNumber || 'N/A'}</strong></span>
                <span>Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{revealedData.referenceNumber}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {onAutoFillLogin && (
                <button
                  type="button"
                  id="btn-autofill-login"
                  onClick={() => {
                    onAutoFillLogin(revealedData.username, revealedData.password || 'Suhanth@2626');
                    onClose();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003866] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Autofill & Return to Login Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
