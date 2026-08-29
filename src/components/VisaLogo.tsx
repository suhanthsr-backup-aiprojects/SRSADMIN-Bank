import React from 'react';

interface VisaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'secure' | 'mark';
  className?: string;
}

export const VisaLogo: React.FC<VisaLogoProps> = ({
  size = 'md',
  variant = 'secure',
  className = '',
}) => {
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }[size];

  if (variant === 'secure') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {/* Visa Mark */}
        <div className="flex items-center">
          <span className="font-serif italic font-black text-[#1A1F71] dark:text-white tracking-tighter text-xl sm:text-2xl leading-none">
            VISA
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#F7B600] text-[#1A1F71] text-[10px] font-black tracking-wider uppercase">
            SECURE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className="font-serif italic font-black text-[#1A1F71] dark:text-white tracking-tighter text-xl sm:text-2xl leading-none">
        VISA
      </span>
    </div>
  );
};
