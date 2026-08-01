'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Home, Mail } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0F26]/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-lg bg-[#3FDCC0]/15 text-[#3FDCC0] flex items-center justify-center group-hover:bg-[#3FDCC0]/25 transition-colors">
            <ShieldCheck size={17} />
          </span>
          <span
            className="text-[15px] font-semibold text-[#F2F4FA] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            HireAssess
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? 'text-[#3FDCC0] bg-[#3FDCC0]/10'
                    : 'text-[#AAB2D4] hover:text-[#F2F4FA] hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="ml-2 rounded-lg bg-[#3FDCC0] text-[#0B0F26] text-[13px] font-semibold px-4 py-2 hover:bg-[#3FDCC0]/90 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}