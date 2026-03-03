'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, type ServiceRequest } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Eye, Search, ClipboardList } from 'lucide-react';

const ALL_STATUSES = ['all', 'pending', 'reviewed', 'in-progress', 'completed', 'rejected', 'on-hold'];
const ALL_SERVICES = ['all', 'custom cloud software', 'business automation', 'digital marketing', 'website maintenance', 'general consultation', 'other'];

export default function RequestsPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<'createdAt' | 'name' | 'service' | 'status' | 'priority'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
                setError(err instanceof Error ? err.message : 'Failed to load requests');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, router]);

    const filtered = useMemo(() => {
        let result = [...requests];

        if (statusFilter !== 'all') {
            result = result.filter((r) => r.status === statusFilter);
        }
        if (serviceFilter !== 'all') {
            result = result.filter((r) => r.service === serviceFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.email.toLowerCase().includes(q) ||
                    r.requestId.toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            const valA = a[sortField] || '';
            const valB = b[sortField] || '';
            const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [requests, statusFilter, serviceFilter, searchQuery, sortField, sortDir]);

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortIndicator = (field: typeof sortField) => {
        if (sortField !== field) return '';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">All Service Requests</h1>
                <p className="text-gray-400 text-sm mt-1">{requests.length} total requests</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="max-w-[180px]"
                >
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>
                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="max-w-[220px]"
                >
                    {ALL_SERVICES.map((s) => (
                        <option key={s} value={s}>
                            {s === 'all' ? 'All Services' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No requests match your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                                        Client{sortIndicator('name')}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => handleSort('service')}>
                                        Service{sortIndicator('service')}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                                        Status{sortIndicator('status')}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => handleSort('priority')}>
                                        Priority{sortIndicator('priority')}
                                    </th>
                                    <th className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                                        Submitted{sortIndicator('createdAt')}
                                    </th>
                                    <th>Message</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((req) => (
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
                                        <td className="text-gray-400 text-sm whitespace-nowrap">{formatDate(req.createdAt)}</td>
                                        <td className="text-gray-400 text-sm max-w-[200px] truncate">{req.message}</td>
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
