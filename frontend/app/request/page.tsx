'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ServiceRequest {
    requestId: string;
    name: string;
    email: string;
    service: string;
    message: string;
    priority: string;
    status: string;
    adminResponse?: string;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'pending': { bg: '#fef3c7', text: '#92400e' },
    'reviewed': { bg: '#dbeafe', text: '#1e40af' },
    'in-progress': { bg: '#fed7aa', text: '#9a3412' },
    'completed': { bg: '#d1fae5', text: '#065f46' },
    'rejected': { bg: '#fecaca', text: '#991b1b' },
    'on-hold': { bg: '#e5e7eb', text: '#374151' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
    'low': { bg: '#d1fae5', text: '#065f46' },
    'medium': { bg: '#fef3c7', text: '#92400e' },
    'high': { bg: '#fecaca', text: '#991b1b' },
};

export default function RequestService() {
    const searchParams = useSearchParams();
    const prefilledService = searchParams.get('service') || '';
    const { isAuthenticated } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);

    const fetchMyRequests = async () => {
        if (!isAuthenticated) {
            setRequests([]);
            return;
        }
        try {
            setRequestsLoading(true);
            setRequestsError(null);
            const data = await api.serviceRequests.mine();
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            setRequestsError(error instanceof Error ? error.message : 'Failed to load requests');
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitSuccess(false);

        const form = e.currentTarget;
        const formData = new FormData(form);

        const submitData: Record<string, unknown> = {
            name: formData.get('name'),
            email: formData.get('email'),
            service: formData.get('service'),
            message: formData.get('message'),
            priority: formData.get('priority'),
        };

        try {
            if (imageFile) {
                setIsUploading(true);
                setUploadError(null);
                const { uploadUrl, key } = await api.uploads.presign({
                    fileName: imageFile.name,
                    contentType: imageFile.type,
                });
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': imageFile.type },
                    body: imageFile,
                });
                if (!uploadResponse.ok) throw new Error('Failed to upload image');
                submitData.imageKey = key;
            }

            await api.serviceRequests.create(submitData);
            setSubmitSuccess(true);
            form.reset();
            setImageFile(null);
            setUploadPreview(null);
            fetchMyRequests();
        } catch (error) {
            console.error('Error submitting service request:', error);
            const message = error instanceof Error ? error.message : 'Failed to submit request';
            setUploadError(message);
        } finally {
            setIsUploading(false);
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <main>
            <section className="section-header" style={{ marginTop: '60px' }}>
                <span className="subtitle">Request a Service</span>
                <h2>Tell Us What You Need</h2>
                <p>Submit a detailed request and our team will review it and get back to you with a plan.</p>
            </section>

            <section style={{ paddingTop: 0 }}>
                <div className="container">
                    {isAuthenticated ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', maxWidth: '800px', margin: '0 auto' }}>
                            {/* Submission Form */}
                            <div className="contact-form">
                                <h3 style={{ marginBottom: '24px', color: 'var(--primary-color)' }}>New Service Request</h3>

                                {submitSuccess && (
                                    <div style={{
                                        padding: '16px 20px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        color: '#10b981',
                                    }}>
                                        ✓ Your service request has been submitted successfully! Our team will review it shortly.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label htmlFor="name">Full Name</label>
                                            <input type="text" id="name" name="name" placeholder="John Doe" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input type="email" id="email" name="email" placeholder="your@email.com" required />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label htmlFor="service">Service Type</label>
                                            <select id="service" name="service" defaultValue={prefilledService} required>
                                                <option value="">Select a service...</option>
                                                <option value="custom cloud software">Custom Cloud Software</option>
                                                <option value="business automation">Business Automation</option>
                                                <option value="digital marketing">Digital Marketing</option>
                                                <option value="website maintenance">Website Maintenance</option>
                                                <option value="general consultation">General Consultation</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="priority">Priority</label>
                                            <select id="priority" name="priority" defaultValue="medium">
                                                <option value="low">Low — No rush</option>
                                                <option value="medium">Medium — Standard timeline</option>
                                                <option value="high">High — Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">Project Details</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={6}
                                            placeholder="Describe your project requirements, goals, timeline, and any other relevant details..."
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="attachment">Attachment (optional)</label>
                                        <input
                                            type="file"
                                            id="attachment"
                                            name="attachment"
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setImageFile(file);
                                                setUploadError(null);
                                                if (file && file.type.startsWith('image/')) {
                                                    setUploadPreview(URL.createObjectURL(file));
                                                } else {
                                                    setUploadPreview(null);
                                                }
                                            }}
                                        />
                                        {uploadPreview && (
                                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img src={uploadPreview} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>File selected</span>
                                            </div>
                                        )}
                                        {uploadError && (
                                            <p style={{ color: '#b91c1c', marginTop: '8px', fontSize: '0.9rem' }}>{uploadError}</p>
                                        )}
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting || isUploading}>
                                        {isSubmitting ? 'Submitting...' : isUploading ? 'Uploading...' : 'Submit Service Request'}
                                    </button>
                                </form>
                            </div>

                            {/* My Requests List */}
                            <div>
                                <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Your Requests</h3>

                                {requestsLoading && (
                                    <p style={{ color: 'var(--text-light)' }}>Loading your requests...</p>
                                )}
                                {requestsError && (
                                    <p style={{ color: '#b91c1c' }}>{requestsError}</p>
                                )}
                                {!requestsLoading && !requestsError && requests.length === 0 && (
                                    <p style={{ color: 'var(--text-light)' }}>No requests yet. Submit one above to get started.</p>
                                )}

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {requests.map((req) => {
                                        const statusStyle = STATUS_COLORS[req.status] || STATUS_COLORS['pending'];
                                        const priorityStyle = PRIORITY_COLORS[req.priority] || PRIORITY_COLORS['medium'];

                                        return (
                                            <div
                                                key={req.requestId}
                                                style={{
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '14px',
                                                    padding: '20px',
                                                    background: 'var(--card)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                            <h4 style={{ color: '#f8fafc', margin: 0 }}>{req.service}</h4>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                padding: '2px 10px',
                                                                borderRadius: '999px',
                                                                fontWeight: 600,
                                                                backgroundColor: statusStyle.bg,
                                                                color: statusStyle.text,
                                                                textTransform: 'capitalize',
                                                            }}>
                                                                {req.status}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                padding: '2px 10px',
                                                                borderRadius: '999px',
                                                                fontWeight: 600,
                                                                backgroundColor: priorityStyle.bg,
                                                                color: priorityStyle.text,
                                                                textTransform: 'capitalize',
                                                            }}>
                                                                {req.priority}
                                                            </span>
                                                        </div>
                                                        <p style={{ color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.5' }}>{req.message}</p>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                                            Submitted {formatDate(req.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {req.adminResponse && (
                                                    <div style={{
                                                        marginTop: '16px',
                                                        padding: '14px 16px',
                                                        background: 'rgba(99, 102, 241, 0.08)',
                                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                                        borderRadius: '10px',
                                                    }}>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>
                                                            Admin Response
                                                        </p>
                                                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                            {req.adminResponse}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
                            <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Authentication Required</h4>
                            <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Please log in to submit a service request.</p>
                            <Link href="/auth" className="btn btn-primary">
                                Log In to Continue
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
