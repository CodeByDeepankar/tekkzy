'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/requests', label: 'All Requests', icon: ClipboardList },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-[#0a0f1a] border-r border-[#1e293b] flex flex-col transition-all duration-200 z-40 ${
                collapsed ? 'w-[68px]' : 'w-[250px]'
            }`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1e293b]">
                <Shield className="w-7 h-7 text-indigo-400 shrink-0" />
                {!collapsed && (
                    <span className="text-lg font-semibold text-white tracking-tight">
                        Tekkzy Admin
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto text-gray-400 hover:text-white transition-colors p-1"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-indigo-500/15 text-indigo-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={collapsed ? label : undefined}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Logout */}
            <div className="px-2 pb-4 border-t border-[#1e293b] pt-4">
                {user && !collapsed && (
                    <div className="px-3 mb-3">
                        <p className="text-sm font-medium text-white truncate">{user.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
