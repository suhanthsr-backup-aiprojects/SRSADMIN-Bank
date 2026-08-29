import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  User, 
  X, 
  ChevronRight, 
  Loader2, 
  ShieldCheck, 
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  CreditCard,
  PieChart,
  ArrowRightLeft,
  Search,
  Bot
} from 'lucide-react';
import { UserAccount, AdminUser, Card, Transaction } from '../types';
import { formatCurrency } from '../utils/bankUtils';
import shristiAvatar from '../assets/images/shristi_mascot_1787969749809.jpg';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'USER' | 'ADMIN';
  currentUser?: UserAccount;
  currentAdmin?: AdminUser;
  cards?: Card[];
  transactions?: Transaction[];
}

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentView,
  currentUser,
  currentAdmin,
  cards = [],
  transactions = [],
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: currentView === 'USER' 
        ? `Namaste ${currentUser?.name ? currentUser.name.split(' ')[0] : ''}! 🙏 I am **Shristi**, your dedicated AI banking assistant. How can I help you analyze your accounts, track expenses, calculate interest, or understand card perks today?`
        : `Greetings Officer ${currentAdmin?.name ? currentAdmin.name.split(' ')[0] : ''}. **Shristi CBS Copilot** is ready. Ask me anything about branch liquidity, KYC compliance, UTR verification, or risk analysis.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const quickPrompts = currentView === 'USER' ? [
    'Break down my recent spending by category',
    'What is my available credit limit & balance?',
    'How do I lock my card if lost or stolen?',
    'What are the charges for IMPS vs NEFT?',
  ] : [
    'Summarize current branch liquidity & customer totals',
    'What are the standard KYC guidelines for new accounts?',
    'How to handle flagged or suspicious high-value UTRs?',
    'Generate an executive summary of credit lines extended',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build lightweight context data for accurate answers
      const contextData = currentView === 'USER' && currentUser ? {
        view: 'RETAIL_CUSTOMER',
        customerName: currentUser.name,
        accountNumber: currentUser.accountNumber,
        accountType: currentUser.accountType,
        balance: currentUser.balance,
        branch: currentUser.branchName,
        kycStatus: currentUser.kycStatus,
        cards: cards
          .filter((c) => c.userId === currentUser.id)
          .map((c) => ({
            type: c.type,
            tier: c.tier,
            last4: c.cardNumber.slice(-4),
            status: c.status,
            creditLimit: c.creditLimit,
            usedLimit: c.usedLimit,
          })),
        recentTransactions: transactions
          .filter((t) => t.accountId === currentUser.id)
          .slice(0, 10)
          .map((t) => ({
            desc: t.merchantName,
            category: t.category,
            type: t.type,
            amount: t.amount,
            date: t.timestamp,
          })),
      } : {
        view: 'BRANCH_CBS_ADMIN',
        adminName: currentAdmin?.name,
        role: currentAdmin?.role,
        branchCode: currentAdmin?.branchCode,
        totalCustomers: 4,
        totalIssuedCards: cards.length,
      };

      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: contextData,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (data.error ? `Note: ${data.error}` : 'Unable to retrieve answer. Please try again.');

      const botMessage: Message = {
        id: `msg-gemini-${Date.now()}`,
        sender: 'gemini',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'gemini',
        text: `We are experiencing a temporary network issue connecting to the Shristi core server. Please try again shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] max-h-[90vh] border border-slate-200 overflow-hidden"
        id="gemini-assistant-modal"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#0B192C] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={shristiAvatar}
                alt="Shristi AI Mascot"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/80 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Shristi</span>
                  <span className="text-xs font-normal text-amber-300 font-hindi">(सृष्टि)</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400/20 to-blue-400/20 text-amber-300 border border-amber-400/30">
                  AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {currentView === 'USER' ? 'Your Personal SRSADMIN Banking Mascot' : 'CBS Branch Officer Intelligence Desk'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Shristi Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAFC]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'gemini' && (
                <img
                  src={shristiAvatar}
                  alt="Shristi"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/50 shrink-0 mt-0.5 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              )}

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#004B87] text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                {msg.sender === 'gemini' ? (
                  <div className="prose prose-xs max-w-none text-slate-800 space-y-1.5 leading-relaxed [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-1 [&>h3]:font-bold [&>h3]:text-slate-900 [&>h4]:font-bold [&>h4]:text-slate-900 [&>strong]:text-slate-950 [&>strong]:font-bold">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-line break-words font-sans text-white">
                    {msg.text}
                  </div>
                )}

                <div className={`mt-1.5 flex items-center justify-between text-[10px] ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'gemini' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="ml-2 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#004B87] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start items-center text-xs text-slate-500 py-2">
              <img
                src={shristiAvatar}
                alt="Shristi"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/50 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-slate-600 shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004B87]" />
                <span>Shristi is analyzing your bank data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-200/80 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#004B87] text-slate-700 text-[11px] font-medium transition-all shrink-0 border border-slate-200/60 disabled:opacity-50 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentView === 'USER' ? 'Ask Shristi about balances, cards, transfers, rates...' : 'Ask Shristi about CBS clearing, liquidity, accounts, KYC...'}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#004B87]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#004B87] hover:bg-[#003B6F] text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
              title="Send to Shristi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Confidential & 256-Bit SSL Protected</span>
            </span>
            <span>Powered by Gemini 3.7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
