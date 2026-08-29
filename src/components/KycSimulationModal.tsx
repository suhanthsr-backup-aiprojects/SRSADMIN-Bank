import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Landmark, 
  X, 
  Copy, 
  Check, 
  Mail, 
  Smartphone, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Lock, 
  ExternalLink,
  QrCode,
  UserCheck
} from 'lucide-react';
import { UserAccount, AdminUser } from '../types';

interface KycSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UserAccount;
  currentAdmin?: AdminUser;
  onKycVerified: (userId: string, panNumber: string) => void;
}

type KycStep = 'PAN_ENTRY' | 'OTP_VERIFICATION' | 'VERIFIED_SUCCESS';

export const KycSimulationModal: React.FC<KycSimulationModalProps> = ({
  isOpen,
  onClose,
  customer,
  currentAdmin,
  onKycVerified,
}) => {
  const [step, setStep] = useState<KycStep>('PAN_ENTRY');
  const [panInput, setPanInput] = useState(customer.panNumber || '');
  const [emailInput, setEmailInput] = useState(customer.email || 'mssgeethu6@gmail.com');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // OTP Session details
  const [kycSessionId, setKycSessionId] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(customer.kycStatus === 'VERIFIED' ? 'VERIFIED_SUCCESS' : 'PAN_ENTRY');
      setPanInput(customer.panNumber || '');
      setEmailInput(customer.email || 'mssgeethu6@gmail.com');
      setErrorMessage(null);
      setOtpInput('');
    }
  }, [isOpen, customer]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (step === 'OTP_VERIFICATION' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  // Validate PAN: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanValid = panRegex.test(panInput.toUpperCase().trim());

  // Generate shareable link
  const currentUrl = window.location.origin + window.location.pathname;
  const shareableKycLink = `${currentUrl}?kyc=${customer.id}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareableKycLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPanValid) {
      setErrorMessage('Please enter a valid 10-character PAN number (e.g. ABCPS8841F).');
      return;
    }

    setIsRequestingOtp(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/kyc/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customer.id,
          name: customer.name,
          email: emailInput.trim() || customer.email || 'mssgeethu6@gmail.com',
          panNumber: panInput.toUpperCase().trim(),
          accountNumber: customer.accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch KYC OTP.');
      }

      setKycSessionId(data.kycSessionId);
      setDemoOtp(data.demoOtp);
      setReferenceCode(data.referenceNumber);
      setMaskedEmail(data.maskedEmail);
      setDeliveryMode(data.deliveryMode);
      setTimerSeconds(300);
      setStep('OTP_VERIFICATION');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch KYC OTP. Please retry.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/kyc/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycSessionId,
          otp: otpInput.trim(),
          panNumber: panInput.toUpperCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'KYC verification failed.');
      }

      setVerifiedTimestamp(new Date().toLocaleString('en-IN') + ' IST');
      setStep('VERIFIED_SUCCESS');
      onKycVerified(customer.id, panInput.toUpperCase().trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect OTP or session expired. Please retry.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-emerald-600/30 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-[#004B87] text-white p-6 flex items-center justify-between border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#FFB800]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFB800] text-[#003B6F] px-2 py-0.5 rounded">
                  RBI KYC COMPLIANCE
                </span>
                <span className="text-xs text-emerald-200 font-mono">e-KYC 2.0 Simulation</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Customer Identity & PAN KYC Simulator
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Context Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Customer: </span>
            <strong className="text-slate-900 font-bold">{customer.name}</strong>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-slate-500 font-mono">A/c: {customer.accountNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              customer.kycStatus === 'VERIFIED' || step === 'VERIFIED_SUCCESS'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {customer.kycStatus === 'VERIFIED' || step === 'VERIFIED_SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  KYC Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Verification Required
                </>
              )}
            </span>
          </div>
        </div>

        {/* Shareable Simulation Link Section */}
        <div className="bg-emerald-50/70 border-b border-emerald-200/80 px-6 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold">Direct Customer Simulation Link:</span>
          </div>
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-md text-emerald-800 font-bold transition-all shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-emerald-700" />
                <span>Copy KYC Link</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Verification Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* STEP 1: PAN & Email Entry */}
          {step === 'PAN_ENTRY' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  Step 1: Enter Permanent Account Number (PAN)
                </p>
                <p className="text-slate-600">
                  Enter the 10-character PAN as registered with the Income Tax Department. A 6-digit OTP will be dispatched from the bank's KYC desk to authenticate identity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PAN Number (10 Characters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panInput}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCPS8841F"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 font-mono text-base font-bold uppercase tracking-widest text-slate-900 transition-all"
                  required
                />
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-slate-500">Format: 5 Letters, 4 Digits, 1 Letter</span>
                  {panInput.length > 0 && (
                    <span className={isPanValid ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      {isPanValid ? "✓ Valid PAN Format" : "Invalid Format"}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email for KYC OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 text-xs font-medium text-slate-900"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  OTP is sent via live Gmail SMTP (or visible via demo simulation code).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRequestingOtp || !isPanValid}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-[#004B87] hover:from-emerald-700 hover:to-[#003B6F] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isRequestingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Bank KYC OTP...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Request Bank Verification OTP</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'OTP_VERIFICATION' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    Step 2: Enter 6-Digit Bank KYC OTP
                  </span>
                  <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Ref: {referenceCode}
                  </span>
                </div>
                <p className="text-slate-600">
                  A verification code was dispatched to <strong className="text-emerald-900 font-mono">{maskedEmail || emailInput}</strong>.
                </p>
              </div>

              {/* Demo OTP Helper Box */}
              {demoOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900">Demo Quick-Fill OTP:</span>
                    <span className="font-mono font-black text-sm text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-amber-300">
                      {demoOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(demoOtp);
                      setCopiedOtp(true);
                      setTimeout(() => setCopiedOtp(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded text-[11px] transition-colors"
                  >
                    {copiedOtp ? "Filled!" : "Auto-Fill"}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit OTP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-600 text-center font-mono text-2xl font-black tracking-[0.5em] text-slate-900 focus:ring-4 focus:ring-emerald-500/20"
                  autoFocus
                  required
                />
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>
                    Expires in: <strong className="text-slate-800 font-mono">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline text-[11px]"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('PAN_ENTRY')}
                  className="w-1/3 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length !== 6}
                  className="w-2/3 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying with CBS Core...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Approve KYC</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Verified Success Certificate */}
          {step === 'VERIFIED_SUCCESS' && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-4 border-emerald-200 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  e-KYC Clearance Certificate Issued
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Customer PAN and identity credentials verified against official banking records.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Account Holder:</span>
                  <strong className="text-slate-900">{customer.name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Account Number:</span>
                  <strong className="text-slate-900 font-mono">{customer.accountNumber}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Verified PAN:</span>
                  <strong className="text-emerald-800 font-mono font-bold">{panInput || customer.panNumber}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                    VERIFIED & ACTIVE
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Verification Ref:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{referenceCode || 'SRSA-KYC-VERIFIED-2026'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & Close KYC Simulator</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
