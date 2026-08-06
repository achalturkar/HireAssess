'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '@/src/hooks/useAuth';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {

  const { loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {

    return (

      <div className="flex h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">

        <div className="text-center">

          <div className="h-12 w-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin mx-auto"/>

          <p className="mt-4 text-[var(--muted)]">

            Loading Dashboard...

          </p>

        </div>

      </div>

    );

  }

  return (

    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">

      <Sidebar

        collapsed={sidebarCollapsed}

        onToggleCollapse={() =>

          setSidebarCollapsed(!sidebarCollapsed)

        }

        mobileOpen={mobileOpen}

        onCloseMobile={() => setMobileOpen(false)}

      />

      <div className="flex flex-1 flex-col overflow-hidden">

        <Navbar

          onOpenMobileMenu={() =>

            setMobileOpen(true)

          }

        />

        <main

          className="flex-1 overflow-y-auto p-6 "

        >

          {children}

        </main>

      </div>

    </div>

  );

}