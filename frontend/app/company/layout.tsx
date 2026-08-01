'use client';

import ProtectedRoute from "@/src/auth/ProtectedRoute";
import CompanyDashboardShell from "@/src/components/layout/company/CompanyDashboardShell";

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <CompanyDashboardShell>
                {children}
            </CompanyDashboardShell>
        </ProtectedRoute>
    );
}