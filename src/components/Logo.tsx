interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DiayemaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M8 6C8 4.89543 8.89543 4 10 4H18C23.5228 4 28 8.47715 28 14V18C28 23.5228 23.5228 28 18 28H10C8.89543 28 8 27.1046 8 26V6Z"
      fill="currentColor"
    />
    <path d="M14 11.5L21 16L14 20.5V11.5Z" fill="#C9A84C" />
  </svg>
);

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const dims = {
    sm: { box: 'w-8 h-8 rounded-lg',  icon: 'w-4 h-4' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
    lg: { box: 'w-12 h-12 rounded-2xl',icon: 'w-6 h-6' },
  };

  const d = dims[size];

  return (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <div className={`${d.box} bg-[#C9A84C] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        <DiayemaIcon className={`${d.icon} text-white`} />
      </div>
    </div>
  );
}

export { DiayemaIcon };
