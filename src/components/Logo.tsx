import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48,
  };
  const d = dims[size];

  return (
    <svg width={d} height={d} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}>
      <defs>
        <linearGradient id="gold-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4B060" />
          <stop offset="60%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A8862A" />
        </linearGradient>
        <linearGradient id="d-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D1A08" />
          <stop offset="100%" stopColor="#1A0F04" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#gold-bg)" />
      <rect x="2" y="2" width="36" height="18" rx="8" fill="white" fillOpacity="0.08" />
      <text x="20" y="29" textAnchor="middle" fontFamily="'Plus Jakarta Sans', Arial Black, sans-serif" fontWeight="900" fontSize="26" fill="url(#d-fill)" letterSpacing="-1">D</text>
    </svg>
  );
};
