'use client';

/**
 * RoundBase Logo — classic minimal "R" monogram
 * Clean circle with an elegant serif-inspired R letterform.
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Clean circle with accent */}
      <circle cx="20" cy="20" r="19" stroke="#4f46e5" strokeWidth="2" fill="none" />
      {/* Elegant R */}
      <path
        d="M14.5 11h7.2c3.2 0 5.6 2.2 5.6 5.2 0 2.6-1.7 4.5-4.2 5.1L27.5 29h-3.2l-4.2-7.4H17.5V29h-3V11zm3 2.4v5.8h4c2 0 3.2-1.2 3.2-2.9 0-1.7-1.2-2.9-3.2-2.9h-4z"
        fill="#1e1b4b"
      />
    </svg>
  );
}

export function LogoFull({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={iconSize} />
      <span
        className="text-[15px] font-semibold text-gray-900"
        style={{ letterSpacing: '0.04em', lineHeight: 1, textTransform: 'uppercase' }}
      >
        RoundBase
      </span>
    </div>
  );
}
