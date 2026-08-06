'use client';

import { ReactNode, useState } from 'react';
import CompanyNavbar from './CompanyNavbar';
import CompanySidebar from './CompanySidebar';

interface Props {
  children: ReactNode;
}

export default function CompanyDashboardShell({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      <CompanySidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <CompanyNavbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}