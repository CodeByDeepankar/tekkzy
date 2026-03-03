'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, type ServiceRequest } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import {
    ClipboardList,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    PauseCircle,
    Eye,
} from 'lucide-react';

const statCards = [
    { key: 'total', label: 'Total Requests', icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { key: 'in-progress', label: 'In Progress', icon: Loader2, color: 'text-orange-400', bg: 'bg-orange-500/15' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
    { key: 'on-hold', label: 'On Hold', icon: PauseCircle, color: 'text-gray-400', bg: 'bg-gray-500/15' },
];

export default function DashboardPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const data = await api.serviceRequests.list();
                setRequests(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, router]);

    const counts: Record<string, number> = {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        reviewed: requests.filter((r) => r.status === 'reviewed').length,
        'in-progress': requests.filter((r) => r.status === 'in-progress').length,
        completed: requests.filter((r) => r.status === 'completed').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
        'on-hold': requests.filter((r) => r.status === 'on-hold').length,
    };

    const recentRequests = requests.slice(0, 10);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Overview of all service requests</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map(({ key, label, icon: Icon, color, bg }) => (
                    <div
                        key={key}
                        className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-4"
                    >
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{counts[key] || 0}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Requests Table */}
            <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
                    <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
                    <Link
                        href="/requests"
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        View All →
                    </Link>
                </div>

                {recentRequests.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No service requests yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Service</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map((req) => (
                                    <tr key={req.requestId}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-white">{req.name}</p>
                                                <p className="text-xs text-gray-500">{req.email}</p>
                                            </div>
                                        </td>
                                        <td className="text-gray-300 capitalize">{req.service}</td>
                                        <td><StatusBadge value={req.status} /></td>
                                        <td><StatusBadge value={req.priority} type="priority" /></td>
                                        <td className="text-gray-400 text-sm">{formatDate(req.createdAt)}</td>
                                        <td>
                                            <Link
                                                href={`/requests/${req.requestId}`}
                                                className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
