import React, { useState } from 'react';
import { Card, CardTheme } from '../types';
import { maskCardNumber } from '../utils/bankUtils';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck, 
  Lock, 
  Wifi, 
  RotateCw,
  AlertCircle
} from 'lucide-react';

interface CardVisualProps {
  card: Card;
  showAdminBadge?: boolean;
  onCardClick?: () => void;
  interactiveFlip?: boolean;
  className?: string;
}

export const CardVisual: React.FC<CardVisualProps> = ({
  card,
  showAdminBadge = true,
  onCardClick,
  interactiveFlip = true,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.cardNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactiveFlip) {
      setIsFlipped(!isFlipped);
    }
  };

  const getThemeStyles = (theme: CardTheme) => {
    switch (theme) {
      case 'canara-gold-rupay':
        return {
          bg: 'bg-gradient-to-tr from-[#946200] via-[#C99700] to-[#FFD043] text-slate-900 border-[#FFE380]/60',
          accent: 'text-amber-900',
          chip: 'bg-gradient-to-br from-slate-100 via-amber-200 to-amber-500',
          highlight: 'from-amber-200/40 via-white/20 to-transparent',
          textColor: 'text-slate-950',
          subtextColor: 'text-amber-950',
          borderAccent: 'border-amber-700/30',
        };
      case 'canara-emerald-select':
        return {
          bg: 'bg-gradient-to-tr from-[#023E3F] via-[#005B5C] to-[#0A8788] text-white border-teal-400/40',
          accent: 'text-teal-200',
          chip: 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600',
          highlight: 'from-teal-300/30 via-white/10 to-transparent',
          textColor: 'text-white',
          subtextColor: 'text-teal-100',
          borderAccent: 'border-teal-300/20',
        };
      case 'canara-sovereign-navy':
        return {
          bg: 'bg-gradient-to-tr from-[#051A30] via-[#0A2D52] to-[#0E447B] text-white border-blue-400/30',
          accent: 'text-amber-300',
          chip: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600',
          highlight: 'from-blue-400/30 via-amber-300/10 to-transparent',
          textColor: 'text-white',
          subtextColor: 'text-blue-200',
          borderAccent: 'border-blue-300/20',
        };
      case 'canara-signature-blue':
      default:
        return {
          bg: 'bg-gradient-to-tr from-[#003B6F] via-[#00559E] to-[#0070CE] text-white border-[#FFB800]/50 shadow-lg',
          accent: 'text-[#FFD700]',
          chip: 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600',
          highlight: 'from-amber-400/30 via-blue-300/10 to-transparent',
          textColor: 'text-white',
          subtextColor: 'text-blue-100',
          borderAccent: 'border-amber-400/30',
        };
    }
  };

  const themeStyle = getThemeStyles(card.theme);

  const renderNetworkLogo = () => {
    switch (card.network) {
      case 'RUPAY':
        return (
          <div className="flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded shadow-sm">
            <span className="font-extrabold text-xs tracking-tight text-[#00843D]">Ru</span>
            <span className="font-extrabold text-xs tracking-tight text-[#F7931E]">Pay</span>
            <span className="text-[8px] uppercase font-bold px-1 py-0.2 bg-[#004B87] text-white rounded ml-0.5">
              {card.tier.includes('SELECT') ? 'SELECT' : 'PLATINUM'}
            </span>
          </div>
        );
      case 'VISA':
        return (
          <div className="bg-white/90 px-2.5 py-0.5 rounded shadow-sm flex items-center">
            <span className="font-black italic tracking-tighter text-sm text-[#00579F] font-mono">VISA</span>
          </div>
        );
      case 'MASTERCARD':
        return (
          <div className="flex items-center bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
            <div className="w-4 h-4 rounded-full bg-[#EB001B]"></div>
            <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-2 mix-blend-multiply"></div>
          </div>
        );
      case 'AMEX':
        return (
          <div className="px-2 py-0.5 bg-blue-700 rounded text-[10px] font-black text-white">
            AMEX
          </div>
        );
      default:
        return <span className="font-bold text-xs">RUPAY</span>;
    }
  };

  return (
    <div 
      className={`relative group perspective-1000 ${className}`}
      onClick={onCardClick}
    >
      <div 
        className={`relative w-full aspect-[1.586/1] rounded-2xl transition-all duration-500 preserve-3d shadow-xl cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT OF SRSADMIN CARD */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 flex flex-col justify-between border ${themeStyle.bg} shadow-2xl overflow-hidden backface-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Official SRSADMIN Bank Watermark Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
          <div className={`absolute -right-20 -top-20 w-56 h-56 rounded-full bg-gradient-to-br ${themeStyle.highlight} blur-2xl pointer-events-none`} />

          {/* Top Row: SRSADMIN Bank Bilingual Brand & Status */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {/* SRSADMIN Bank Emblem */}
              <div className="w-8 h-8 rounded-lg bg-white/95 p-1 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="50,8 92,82 8,82" fill="none" stroke="#004B87" strokeWidth="14" strokeLinejoin="round" />
                  <polygon points="50,92 8,18 92,18" fill="none" stroke="#FFB800" strokeWidth="14" strokeLinejoin="round" />
                  <polygon points="50,28 76,74 24,74" fill="#004B87" />
                  <polygon points="50,72 26,26 74,26" fill="#FFB800" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif font-bold text-xs text-amber-300">एसआरएसएडमिन</span>
                  <span className="text-[11px] text-white font-extrabold uppercase tracking-tight">SRSADMIN Bank</span>
                </div>
                <p className={`text-[8px] uppercase tracking-wider font-semibold ${themeStyle.subtextColor}`}>
                  {card.cardNickname || (card.type === 'DEBIT' ? 'International Debit Card' : 'Credit Card')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {card.status === 'ACTIVE' ? (
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </div>
              ) : card.status === 'FROZEN' ? (
                <div className="flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-500/50">
                  <Lock className="w-2.5 h-2.5" />
                  Frozen
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded-full border border-rose-500/50">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {card.status}
                </div>
              )}
            </div>
          </div>

          {/* Middle Row: EMV Gold Chip & Wi-Fi Contactless Symbol */}
          <div className="relative z-10 flex items-center justify-between my-auto">
            <div className="flex items-center gap-3">
              {/* EMV Microchip */}
              <div className={`w-10 h-7 rounded-md ${themeStyle.chip} p-1 relative border border-amber-200/60 shadow-md flex flex-col justify-between overflow-hidden`}>
                <div className="w-full h-[1px] bg-amber-900/40 mt-0.5"></div>
                <div className="w-full h-[1px] bg-amber-900/40"></div>
                <div className="w-full h-[1px] bg-amber-900/40 mb-0.5"></div>
                <div className="absolute inset-x-2 inset-y-1 border border-amber-950/30 rounded-sm"></div>
              </div>
              <Wifi className={`w-4 h-4 ${themeStyle.subtextColor} rotate-90 transform`} />
            </div>

            {showAdminBadge && (
              <div className="flex items-center gap-1 text-[8px] font-mono text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20">
                <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
                <span>CBS AUTH</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Card Number, Name, Validity & RuPay Logo */}
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`font-mono text-sm sm:text-base font-bold tracking-widest ${themeStyle.textColor} select-all drop-shadow-sm`}>
                {isRevealed ? card.cardNumber : maskCardNumber(card.cardNumber)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id={`reveal-card-${card.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRevealed(!isRevealed);
                  }}
                  className="p-1 rounded bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors"
                  title={isRevealed ? 'Mask card' : 'Show full number'}
                >
                  {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  id={`copy-card-${card.id}`}
                  onClick={handleCopy}
                  className="p-1 rounded bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors"
                  title="Copy number"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between pt-1 border-t border-white/15">
              <div>
                <span className={`text-[8px] uppercase tracking-wider ${themeStyle.subtextColor} block font-medium`}>Cardholder</span>
                <span className={`font-bold text-xs tracking-wide uppercase ${themeStyle.textColor} font-sans truncate max-w-[140px] block`}>
                  {card.cardholderName}
                </span>
              </div>

              <div className="text-center">
                <span className={`text-[8px] uppercase tracking-wider ${themeStyle.subtextColor} block font-medium`}>Valid Thru</span>
                <span className={`font-mono font-bold text-xs ${themeStyle.textColor}`}>
                  {card.expiryMonth}/{card.expiryYear}
                </span>
              </div>

              <div>
                {renderNetworkLogo()}
              </div>
            </div>
          </div>

          {interactiveFlip && (
            <button
              type="button"
              id={`flip-card-${card.id}`}
              onClick={toggleFlip}
              className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all z-20"
              title="Flip to view CVV & Helpline"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* BACK OF SRSADMIN CARD */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-2xl py-3 flex flex-col justify-between border ${themeStyle.bg} shadow-2xl overflow-hidden rotate-y-180 backface-hidden`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="px-4 text-[8px] text-white/90 flex items-center justify-between font-mono">
            <span>SRSADMIN HELPLINE: 1800 425 0018 / 1800 1030</span>
            <span>CARD REF: {card.id.slice(-6).toUpperCase()}</span>
          </div>

          {/* Magnetic Stripe */}
          <div className="w-full h-9 bg-zinc-950 my-1 border-y border-zinc-800"></div>

          {/* Signature Strip & CVV */}
          <div className="px-4 space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-7 bg-white rounded text-[8px] text-slate-800 font-mono italic flex items-center px-2.5 select-none overflow-hidden relative border border-slate-300">
                <span className="opacity-80 truncate font-serif">{card.cardholderName} - Authorized Signature</span>
                <div className="absolute right-0 inset-y-0 w-12 bg-amber-100 flex items-center justify-center font-mono font-bold text-slate-950 border-l border-slate-300">
                  <span className="text-[7px] text-slate-500 mr-0.5">CVV</span>
                  <span>{card.cvv}</span>
                </div>
              </div>
            </div>
            <p className="text-[7px] text-white/80 leading-tight">
              Authorized signature required. This card is property of SRSADMIN Bank and must be surrendered upon demand.
            </p>
          </div>

          <div className="px-4 pt-1 border-t border-white/15 flex items-center justify-between text-[8px] text-white/90">
            <div>
              <span className="text-[7px] uppercase tracking-wider text-amber-300 block font-mono">ISSUED BY BRANCH CBS</span>
              <span className="font-bold text-white truncate max-w-[150px] block">
                {card.issuedByAdminName}
              </span>
              <span className="text-[7px] font-mono text-white/70 block">
                Date: {card.issuedDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id={`flip-back-card-${card.id}`}
                onClick={toggleFlip}
                className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                title="Flip to front"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
