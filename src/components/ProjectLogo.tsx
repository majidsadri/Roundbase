'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

interface ProjectLogoProps {
  logoUrl?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: { box: 'w-6 h-6', icon: 10, text: 'text-[9px]', rounded: 'rounded-md' },
  sm: { box: 'w-8 h-8', icon: 13, text: 'text-[10px]', rounded: 'rounded-lg' },
  md: { box: 'w-10 h-10', icon: 18, text: 'text-xs', rounded: 'rounded-xl' },
  lg: { box: 'w-14 h-14', icon: 24, text: 'text-sm', rounded: 'rounded-xl' },
};

export default function ProjectLogo({ logoUrl, name, size = 'md', className = '' }: ProjectLogoProps) {
  const [imgError, setImgError] = useState(false);
  const s = SIZES[size];

  // Generate initials from project name
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color from the name
  const colors = [
    'bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
  ];
  const colorIdx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIdx];

  if (logoUrl && !imgError) {
    return (
      <div className={`${s.box} ${s.rounded} overflow-hidden flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center ${className}`}>
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${s.box} ${s.rounded} flex-shrink-0 ${bgColor} flex items-center justify-center ${className}`}>
      {initials ? (
        <span className={`${s.text} font-bold text-white leading-none`}>{initials}</span>
      ) : (
        <FolderOpen size={s.icon} className="text-white opacity-80" />
      )}
    </div>
  );
}
