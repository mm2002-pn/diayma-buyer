interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DiaymaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M8 6C8 4.89543 8.89543 4 10 4H18C23.5228 4 28 8.47715 28 14V18C28 23.5228 23.5228 28 18 28H10C8.89543 28 8 27.1046 8 26V6Z"
      fill="currentColor"
    />
    <path d="M14 11.5L21 16L14 20.5V11.5Z" fill="#0066FF" />
  </svg>
);

export function Logo({ variant = 'light', size = 'md', className = '' }: LogoProps) {
  const isDark = variant === 'dark';

  const dims = {
    sm: { box: 'w-8 h-8 rounded-lg',  icon: 'w-4 h-4', text: 'text-lg',              gap: 'gap-2.5' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', text: 'text-xl sm:text-2xl', gap: 'gap-3'   },
    lg: { box: 'w-12 h-12 rounded-2xl',icon: 'w-6 h-6', text: 'text-2xl sm:text-3xl',gap: 'gap-3.5' },
  };

  const d = dims[size];

  return (
    <div className={`inline-flex items-center ${d.gap} select-none group ${className}`}>
      <div className={`${d.box} bg-[#0066FF] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        <DiaymaIcon className={`${d.icon} text-white`} />
      </div>
      <span className={`font-extrabold tracking-tight leading-none ${d.text} ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Diayma<span className="text-[#0066FF]">.</span>
      </span>
    </div>
  );
}

export { DiaymaIcon };
