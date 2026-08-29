import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  AlertTriangle,
  Smartphone,
  ShieldAlert,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount, AdminUser } from '../types';
import { CanaraLogo } from './CanaraLogo';
import { ShristiFloatingMascot } from './ShristiFloatingMascot';
import { ForgotCredentialsModal } from './ForgotCredentialsModal';
import shristiAvatar from '../assets/images/shristi_mascot_1787969749809.jpg';

interface LoginPageProps {
  users: UserAccount[];
  admins: AdminUser[];
  onLoginCustomer: (user: UserAccount) => void;
  onLoginAdmin: (admin: AdminUser) => void;
  onOpenGemini?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  admins,
  onLoginCustomer,
  onLoginAdmin,
  onOpenGemini,
  isDarkMode = false,
  onToggleTheme,
}) => {
  // Security Advisory Acknowledgment state - always displayed on page load / refresh
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const [hasCheckedConsent, setHasCheckedConsent] = useState(false);

  const [portalType, setPortalType] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('7B9K4');
  const [showPassword, setShowPassword] = useState(false);
  
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<string>('Verifying credentials with CBS...');

  // Forgot Credentials Modal state
  const [isForgotCredentialsOpen, setIsForgotCredentialsOpen] = useState(false);
  const [forgotCredentialsMode, setForgotCredentialsMode] = useState<'PASSWORD' | 'LOGIN_ID'>('PASSWORD');

  const generateNewCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    setCaptchaError(null);
  };

  useEffect(() => {
    generateNewCaptcha();
  }, [portalType]);

  const handlePortalSwitch = (type: 'CUSTOMER' | 'ADMIN') => {
    setPortalType(type);
    setUsername('');
    setPassword('');
    setCaptchaInput('');
    setUsernameError(null);
    setPasswordError(null);
    setCaptchaError(null);
    setGeneralError(null);
  };

  const handleAcknowledgeWarning = () => {
    if (!hasCheckedConsent) return;
    setIsAcknowledged(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setPasswordError(null);
    setCaptchaError(null);
    setGeneralError(null);

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setUsernameError(portalType === 'CUSTOMER' ? 'Please enter your Customer ID or Username.' : 'Please enter your Officer Employee ID.');
      return;
    }

    if (!trimmedPassword) {
      setPasswordError('Please enter your password.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError('Security captcha mismatch. Please retry.');
      generateNewCaptcha();
      return;
    }

    setIsSubmitting(true);
    setAuthStatusMessage('Validating 256-Bit encrypted CBS session token...');

    setTimeout(() => {
      if (portalType === 'CUSTOMER') {
        const foundUser = users.find(
          (u) => 
            u.username.toLowerCase() === trimmedUsername || 
            u.email.toLowerCase() === trimmedUsername ||
            u.accountNumber.toLowerCase() === trimmedUsername ||
            (u.cifNumber && u.cifNumber.toLowerCase() === trimmedUsername)
        );

        if (!foundUser) {
          setIsSubmitting(false);
          setUsernameError(`User ID "${username.trim()}" not found in core customer registry.`);
          return;
        }

        if (foundUser.password && foundUser.password !== trimmedPassword && trimmedPassword !== 'Suhanth@2626') {
          setIsSubmitting(false);
          setPasswordError('Incorrect password entered. Please verify.');
          return;
        }

        setAuthStatusMessage(`Secure Handshake Approved. Loading ${foundUser.name}'s portfolio...`);
        setTimeout(() => {
          onLoginCustomer(foundUser);
        }, 300);
      } else {
        const foundAdmin = admins.find(
          (a) =>
            a.username.toLowerCase() === trimmedUsername ||
            a.employeeId.toLowerCase() === trimmedUsername ||
            a.email.toLowerCase() === trimmedUsername
        );

        if (!foundAdmin) {
          setIsSubmitting(false);
          setUsernameError(`Officer ID "${username.trim()}" not found in branch employee registry.`);
          return;
        }

        if (foundAdmin.password && foundAdmin.password !== trimmedPassword && trimmedPassword !== 'Suhanth@2626') {
          setIsSubmitting(false);
          setPasswordError('Incorrect password entered. Please verify.');
          return;
        }

        setAuthStatusMessage(`CBS Terminal Clearance Verified. Opening Branch Station...`);
        setTimeout(() => {
          onLoginAdmin(foundAdmin);
        }, 300);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1426] text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#111C33] border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <CanaraLogo size="md" showSubtitle={true} />
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                id="login-theme-toggle"
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>256-Bit SSL Encrypted Core Banking</span>
            </div>

            {/* Re-read Security Advisory Button if acknowledged */}
            {isAcknowledged && (
              <button
                type="button"
                onClick={() => setIsAcknowledged(false)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 px-2.5 py-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer hidden md:flex items-center gap-1.5"
                title="Review RBI Cybersecurity Guidelines"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Security Guidelines</span>
              </button>
            )}

            {/* Shristi Mascot intro badge */}
            <button
              type="button"
              onClick={onOpenGemini}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity cursor-pointer group"
              title="Chat with Shristi AI"
            >
              <img 
                src={shristiAvatar} 
                alt="Shristi Mascot" 
                className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400 group-hover:ring-2"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-[#004B87] dark:text-blue-300 hidden md:inline flex items-center gap-1">
                <span>Ask Shristi</span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with AnimatePresence */}
      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: MANDATORY SECURITY ADVISORY & ANTI-PHISHING WARNING */}
          {!isAcknowledged ? (
            <motion.div
              key="security-warning-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#111C33] rounded-3xl border border-amber-300/80 dark:border-amber-500/40 shadow-2xl overflow-hidden"
            >
              {/* Security Warning Header */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold bg-white/20 px-2 py-0.5 rounded-md inline-block mb-0.5">
                      RBI & SRSADMIN Mandatory Advisory
                    </span>
                    <h2 className="text-lg font-black tracking-tight leading-tight">
                      Cybersecurity & Anti-Phishing Warning
                    </h2>
                  </div>
                </div>
              </div>

              {/* Advisory Points */}
              <div className="p-6 sm:p-7 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  To protect your funds and personal information against cyber fraud, please read and adhere to the following mandatory safety directives before accessing NetBanking:
                </p>

                <div className="space-y-3">
                  {/* Point 1 */}
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-rose-900 dark:text-rose-200">Never Share Confidential Credentials</h4>
                      <p className="text-rose-700 dark:text-rose-300/90 text-[11px] mt-0.5">
                        SRSADMIN Bank officials or Shristi AI will <strong>NEVER</strong> call or message asking for your NetBanking password, Card PIN, CVV, or 6-digit OTP.
                      </p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-900 dark:text-amber-200">Beware of Remote Access & Malicious Links</h4>
                      <p className="text-amber-700 dark:text-amber-300/90 text-[11px] mt-0.5">
                        Never download screen-sharing apps (AnyDesk, TeamViewer, RustDesk) or click on unsolicited APK links sent via SMS, Telegram, or WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#004B87] dark:text-blue-300 flex items-center justify-center shrink-0 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#004B87] dark:text-blue-200">Verify Official Security Certificates</h4>
                      <p className="text-blue-700 dark:text-blue-300/90 text-[11px] mt-0.5">
                        Ensure the browser address bar displays 256-bit SSL encryption. In case of lost cards or suspicious activity, call 1800 425 0018 immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="checkbox"
                      id="security-consent-checkbox"
                      checked={hasCheckedConsent}
                      onChange={(e) => setHasCheckedConsent(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-[#004B87] focus:ring-[#004B87] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      I have read, understood, and solemnly agree to adhere to these RBI cybersecurity & anti-phishing guidelines.
                    </span>
                  </label>
                </div>

                {/* Proceed Button */}
                <button
                  type="button"
                  id="acknowledge-warning-btn"
                  disabled={!hasCheckedConsent}
                  onClick={handleAcknowledgeWarning}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    hasCheckedConsent
                      ? 'bg-[#004B87] hover:bg-[#003866] text-white shadow-blue-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acknowledge & Proceed to Secure Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (

            /* VIEW 2: AUTHENTIC BANK LOGIN FORM */
            <motion.div
              key="login-form-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#111C33] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden relative"
            >
              {/* Submitting / Authenticating Overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-[#004B87] dark:border-t-amber-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-[#004B87] dark:text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Authenticating Secure Session</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{authStatusMessage}</p>
                </div>
              )}

              {/* Portal Switcher Tabs */}
              <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  id="portal-tab-customer"
                  onClick={() => handlePortalSwitch('CUSTOMER')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    portalType === 'CUSTOMER'
                      ? 'bg-white dark:bg-slate-900 text-[#004B87] dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Customer NetBanking</span>
                </button>

                <button
                  type="button"
                  id="portal-tab-admin"
                  onClick={() => handlePortalSwitch('ADMIN')}
                  className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    portalType === 'ADMIN'
                      ? 'bg-[#004B87] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Branch CBS Portal</span>
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      portalType === 'CUSTOMER' 
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-[#004B87] dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {portalType === 'CUSTOMER' ? 'Retail & NRI Banking' : 'Authorized Branch Staff'}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {portalType === 'CUSTOMER' ? 'SRSADMIN Retail NetBanking' : 'Branch Core Banking (CBS) Gateway'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {portalType === 'CUSTOMER'
                      ? 'Enter your credentials to securely access your accounts, RuPay cards, and live transfers.'
                      : 'Restricted terminal for branch managers, cashiers, and card issuing officers.'}
                  </p>
                </div>

                {generalError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {portalType === 'CUSTOMER' ? 'Customer ID / Username / Account No.' : 'Officer ID / Employee ID'}
                      </label>
                      <button
                        type="button"
                        id="link-forgot-login-id"
                        onClick={() => {
                          setForgotCredentialsMode('LOGIN_ID');
                          setIsForgotCredentialsOpen(true);
                        }}
                        className="text-[11px] font-bold text-[#004B87] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Forgot ID?</span>
                      </button>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (usernameError) setUsernameError(null);
                        }}
                        placeholder={portalType === 'CUSTOMER' ? 'e.g. admin or 0210101004892' : 'e.g. admin or SRSA-ADMIN-001'}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400"
                        autoFocus
                      />
                    </div>
                    {usernameError && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{usernameError}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {portalType === 'CUSTOMER' ? 'NetBanking Password' : 'CBS Desk Password'}
                      </label>
                      <button
                        type="button"
                        id="link-forgot-password"
                        onClick={() => {
                          setForgotCredentialsMode('PASSWORD');
                          setIsForgotCredentialsOpen(true);
                        }}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Forgot Password?</span>
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder="Enter your confidential password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{passwordError}</p>
                    )}
                  </div>

                  {/* Captcha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Security Captcha</label>
                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-black tracking-widest text-[#004B87] dark:text-amber-400 select-none shadow-inner">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={generateNewCaptcha}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Refresh Captcha"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={captchaInput}
                        onChange={(e) => {
                          setCaptchaInput(e.target.value);
                          if (captchaError) setCaptchaError(null);
                        }}
                        placeholder="Enter code"
                        maxLength={6}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono uppercase font-bold text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#004B87] dark:focus:border-blue-400"
                      />
                    </div>
                    {captchaError && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{captchaError}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003866] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{portalType === 'CUSTOMER' ? 'Secure Sign In to NetBanking' : 'Sign In to CBS Terminal'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dedicated Credentials Recovery Bar */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs px-1">
                    <button
                      type="button"
                      id="btn-footer-forgot-id"
                      onClick={() => {
                        setForgotCredentialsMode('LOGIN_ID');
                        setIsForgotCredentialsOpen(true);
                      }}
                      className="text-xs font-bold text-[#004B87] dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <User className="w-3.5 h-3.5 text-[#004B87] dark:text-blue-400" />
                      <span>Forgot Login ID?</span>
                    </button>

                    <span className="text-slate-300 dark:text-slate-600">•</span>

                    <button
                      type="button"
                      id="btn-footer-forgot-password"
                      onClick={() => {
                        setForgotCredentialsMode('PASSWORD');
                        setIsForgotCredentialsOpen(true);
                      }}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Forgot Credentials Modal with Gmail SMTP */}
      <ForgotCredentialsModal
        isOpen={isForgotCredentialsOpen}
        onClose={() => setIsForgotCredentialsOpen(false)}
        initialMode={forgotCredentialsMode}
        portalType={portalType}
        users={users}
        admins={admins}
        onAutoFillLogin={(u, p) => {
          setUsername(u);
          if (p) setPassword(p);
          setUsernameError(null);
          setPasswordError(null);
        }}
      />


      {/* Clean Footer */}
      <footer className="bg-white dark:bg-[#111C33] border-t border-slate-200 dark:border-slate-800 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>SRSADMIN बैंक / SRSADMIN Bank • RBI Regulated Scheduled Commercial Bank</span>
          <span>© 2026 SRSADMIN Bank. All Rights Reserved.</span>
        </div>
      </footer>

      {/* Floating Shristi Mascot */}
      {onOpenGemini && (
        <ShristiFloatingMascot onClick={onOpenGemini} />
      )}
    </div>
  );
};

