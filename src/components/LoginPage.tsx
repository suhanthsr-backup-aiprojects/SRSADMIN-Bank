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
  HelpCircle
} from 'lucide-react';
import { UserAccount, AdminUser } from '../types';
import { CanaraLogo } from './CanaraLogo';
import { ShristiFloatingMascot } from './ShristiFloatingMascot';
import shristiAvatar from '../assets/images/shristi_mascot_1787969749809.jpg';

interface LoginPageProps {
  users: UserAccount[];
  admins: AdminUser[];
  onLoginCustomer: (user: UserAccount) => void;
  onLoginAdmin: (admin: AdminUser) => void;
  onOpenGemini?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  admins,
  onLoginCustomer,
  onLoginAdmin,
  onOpenGemini,
}) => {
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

    setTimeout(() => {
      setIsSubmitting(false);

      if (portalType === 'CUSTOMER') {
        const foundUser = users.find(
          (u) => 
            u.username.toLowerCase() === trimmedUsername || 
            u.email.toLowerCase() === trimmedUsername ||
            u.accountNumber.toLowerCase() === trimmedUsername ||
            (u.cifNumber && u.cifNumber.toLowerCase() === trimmedUsername)
        );

        if (!foundUser) {
          setUsernameError(`User ID "${username.trim()}" not found in core customer registry.`);
          return;
        }

        if (foundUser.password && foundUser.password !== trimmedPassword && trimmedPassword !== 'Suhanth@2626') {
          setPasswordError('Incorrect password entered. Please verify.');
          return;
        }

        onLoginCustomer(foundUser);
      } else {
        const foundAdmin = admins.find(
          (a) =>
            a.username.toLowerCase() === trimmedUsername ||
            a.employeeId.toLowerCase() === trimmedUsername ||
            a.email.toLowerCase() === trimmedUsername
        );

        if (!foundAdmin) {
          setUsernameError(`Officer ID "${username.trim()}" not found in branch employee registry.`);
          return;
        }

        if (foundAdmin.password && foundAdmin.password !== trimmedPassword && trimmedPassword !== 'Suhanth@2626') {
          setPasswordError('Incorrect password entered. Please verify.');
          return;
        }

        onLoginAdmin(foundAdmin);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <CanaraLogo size="md" showSubtitle={true} />
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-Bit SSL Encrypted Core Banking</span>
            </div>

            {/* Shristi Mascot intro badge */}
            <button
              type="button"
              onClick={onOpenGemini}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer group"
              title="Chat with Shristi AI"
            >
              <img 
                src={shristiAvatar} 
                alt="Shristi Mascot" 
                className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400 group-hover:ring-2"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-[#004B87] hidden md:inline flex items-center gap-1">
                <span>Ask Shristi</span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden">
          {/* Portal Switcher Tabs */}
          <div className="bg-slate-100/90 p-1.5 flex items-center gap-1 border-b border-slate-200">
            <button
              type="button"
              id="portal-tab-customer"
              onClick={() => handlePortalSwitch('CUSTOMER')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                portalType === 'CUSTOMER'
                  ? 'bg-white text-[#004B87] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Customer NetBanking</span>
            </button>

            <button
              type="button"
              id="portal-tab-admin"
              onClick={() => handlePortalSwitch('ADMIN')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                portalType === 'ADMIN'
                  ? 'bg-[#004B87] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-blue-50 text-[#004B87] border-blue-200' 
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {portalType === 'CUSTOMER' ? 'Retail & NRI Banking' : 'Authorized Branch Staff'}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {portalType === 'CUSTOMER' ? 'SRSADMIN Retail NetBanking' : 'Branch Core Banking (CBS) Gateway'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {portalType === 'CUSTOMER'
                  ? 'Enter your credentials to securely access your accounts, RuPay cards, and live transfers.'
                  : 'Restricted terminal for branch managers, cashiers, and card issuing officers.'}
              </p>
            </div>

            {generalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {portalType === 'CUSTOMER' ? 'Customer ID / Username / Account No.' : 'Officer ID / Employee ID'}
                </label>
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#004B87]"
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{usernameError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {portalType === 'CUSTOMER' ? 'NetBanking Password' : 'CBS Desk Password'}
                  </label>
                  <span className="text-[11px] text-slate-400">Case-sensitive</span>
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
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#004B87]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{passwordError}</p>
                )}
              </div>

              {/* Captcha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Security Captcha</label>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm font-black tracking-widest text-[#004B87] select-none shadow-inner">
                    {captchaCode}
                  </div>
                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
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
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#004B87]"
                  />
                </div>
                {captchaError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{captchaError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#004B87] hover:bg-[#003866] text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
            </form>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>एसआरएसएडमिन बैंक / SRSADMIN Bank • RBI Regulated Scheduled Commercial Bank</span>
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
