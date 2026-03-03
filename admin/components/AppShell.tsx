'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    // Never block the login page behind a loading spinner
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated: render children (pages redirect to /login themselves)
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    // Authenticated: sidebar layout
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[250px] p-8">
                {children}
            </main>
        </div>
    );
}
