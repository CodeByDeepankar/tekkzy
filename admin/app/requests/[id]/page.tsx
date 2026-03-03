'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, type ServiceRequest } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeft, Trash2, Send, Save, Clock } from 'lucide-react';

const ALL_STATUSES = ['pending', 'reviewed', 'in-progress', 'completed', 'rejected', 'on-hold'];

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    const [request, setRequest] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Status update
    const [newStatus, setNewStatus] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Admin response
    const [responseText, setResponseText] = useState('');
    const [responseSaving, setResponseSaving] = useState(false);

    // Admin notes
    const [notesText, setNotesText] = useState('');
    const [notesSaving, setNotesSaving] = useState(false);

    // Delete
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchRequest = async () => {
        try {
            const data = await api.serviceRequests.getById(id);
            setRequest(data);
            setNewStatus(data.status);
            setResponseText(data.adminResponse || '');
            setNotesText(data.adminNotes || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load request');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchRequest();
    }, [isAuthenticated, id]);

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === request?.status) return;
        setStatusUpdating(true);
        try {
            await api.serviceRequests.updateStatus(id, newStatus);
            await fetchRequest();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleResponseSave = async () => {
        if (!responseText.trim()) return;
        setResponseSaving(true);
        try {
            await api.serviceRequests.respond(id, responseText);
            await fetchRequest();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save response');
        } finally {
            setResponseSaving(false);
        }
    };

    const handleNotesSave = async () => {
        setNotesSaving(true);
        try {
            await api.serviceRequests.updateNotes(id, notesText);
            await fetchRequest();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save notes');
        } finally {
            setNotesSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.serviceRequests.delete(id);
            router.push('/requests');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete request');
            setDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div>
                <Link href="/requests" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Requests
                </Link>
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    {error || 'Request not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            {/* Back link */}
            <Link href="/requests" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Requests
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">{request.name}</h1>
                    <p className="text-gray-400 text-sm mt-1">{request.email}</p>
                    <p className="text-gray-500 text-xs mt-1 font-mono">ID: {request.requestId}</p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge value={request.status} />
                    <StatusBadge value={request.priority} type="priority" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Request Details */}
                    <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Request Details</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Service</p>
                                <p className="text-gray-200 capitalize">{request.service}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Priority</p>
                                <StatusBadge value={request.priority} type="priority" />
                            </div>
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Submitted</p>
                                <p className="text-gray-300 text-sm">{formatDate(request.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Last Updated</p>
                                <p className="text-gray-300 text-sm">{formatDate(request.updatedAt)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-gray-500 mb-2">Message</p>
                            <div className="bg-[#060a13] rounded-lg p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {request.message}
                            </div>
                        </div>
                        {request.imageUrl && (
                            <div className="mt-4">
                                <p className="text-xs uppercase text-gray-500 mb-2">Attachment</p>
                                <img
                                    src={request.imageUrl}
                                    alt="Attachment"
                                    className="rounded-lg max-w-full max-h-[300px] object-contain border border-[#1e293b]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Admin Response */}
                    <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Admin Response
                            <span className="text-xs font-normal text-gray-500 ml-2">(visible to client)</span>
                        </h2>
                        <textarea
                            rows={4}
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write a response to the client..."
                        />
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleResponseSave}
                                disabled={responseSaving}
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {responseSaving ? 'Saving...' : 'Send Response'}
                            </button>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Internal Notes
                            <span className="text-xs font-normal text-gray-500 ml-2">(admin only)</span>
                        </h2>
                        <textarea
                            rows={3}
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add internal notes about this request..."
                        />
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleNotesSave}
                                disabled={notesSaving}
                                className="btn-outline inline-flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {notesSaving ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Status Update */}
                    <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="mb-3"
                        >
                            {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={statusUpdating || newStatus === request.status}
                            className="btn-primary w-full"
                        >
                            {statusUpdating ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>

                    {/* Status History */}
                    <div className="bg-[#0d1424] border border-[#1e293b] rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
                        <div className="space-y-4">
                            {(request.statusHistory || []).map((entry, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5" />
                                        {i < (request.statusHistory?.length || 0) - 1 && (
                                            <div className="w-px flex-1 bg-[#1e293b] mt-1" />
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <StatusBadge value={entry.status} className="mb-1" />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(entry.timestamp).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-600">{entry.changedBy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-[#0d1424] border border-red-500/20 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn-danger w-full inline-flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Request
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-400">
                                    Are you sure? This action cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="btn-danger flex-1"
                                    >
                                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="btn-outline flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
