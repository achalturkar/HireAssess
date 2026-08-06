import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export default function BrandMark({ size = 26, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="12" width="7" height="15" rx="2" fill="#3FDCC0" />
      <rect x="12.5" y="4" width="7" height="23" rx="2" fill="#F2AE55" />
      <rect x="22" y="9" width="5" height="18" rx="2" fill="#3FDCC0" opacity="0.55" />
    </svg>
  );
}
