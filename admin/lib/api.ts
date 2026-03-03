import { Amplify } from 'aws-amplify';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';

// Configure Amplify — env vars set in .env.local
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const region = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';

if (userPoolId && userPoolClientId) {
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId,
                userPoolClientId,
                loginWith: { email: true },
            },
        },
    });
}

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

async function getIdToken(): Promise<string> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error('Not authenticated');
    return token;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getIdToken();
    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
}

export interface ServiceRequest {
    requestId: string;
    userId: string;
    name: string;
    email: string;
    service: string;
    message: string;
    priority: string;
    status: string;
    statusHistory: Array<{ status: string; timestamp: string; changedBy: string }>;
    adminNotes: string;
    adminResponse: string;
    imageKey?: string;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            const result = await signIn({
                username: email.toLowerCase(),
                password,
            });

            if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                throw new Error('Account not verified');
            }

            // Verify admin group membership
            const session = await fetchAuthSession();
            const payload = session.tokens?.idToken?.payload;
            const groups = (payload?.['cognito:groups'] as string[]) || [];

            if (!groups.includes('admin')) {
                await signOut();
                throw new Error('You do not have admin access');
            }

            return {
                id: payload?.sub || '',
                name: (payload?.name as string) || '',
                email: (payload?.email as string) || email.toLowerCase(),
                groups,
            };
        },
        logout: async () => {
            await signOut();
        },
        getSession: async () => {
            try {
                const session = await fetchAuthSession();
                const payload = session.tokens?.idToken?.payload;
                if (!payload) return null;

                const groups = (payload['cognito:groups'] as string[]) || [];
                if (!groups.includes('admin')) return null;

                return {
                    id: payload.sub || '',
                    name: (payload.name as string) || '',
                    email: (payload.email as string) || '',
                    groups,
                };
            } catch {
                return null;
            }
        },
    },
    serviceRequests: {
        list: async (filters?: { status?: string; service?: string }) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const params = new URLSearchParams();
            if (filters?.status) params.set('status', filters.status);
            if (filters?.service) params.set('service', filters.service);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await authFetch(`${API_BASE_URL}/api/service-requests${qs}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to fetch requests');
            }
            return res.json() as Promise<ServiceRequest[]>;
        },
        getById: async (id: string) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const res = await authFetch(`${API_BASE_URL}/api/service-requests/${id}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to fetch request');
            }
            return res.json() as Promise<ServiceRequest>;
        },
        updateStatus: async (id: string, status: string) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const res = await authFetch(`${API_BASE_URL}/api/service-requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update status');
            }
            return res.json();
        },
        respond: async (id: string, adminResponse: string) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const res = await authFetch(`${API_BASE_URL}/api/service-requests/${id}/response`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminResponse }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to send response');
            }
            return res.json();
        },
        updateNotes: async (id: string, adminNotes: string) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const res = await authFetch(`${API_BASE_URL}/api/service-requests/${id}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to update notes');
            }
            return res.json();
        },
        delete: async (id: string) => {
            if (!API_BASE_URL) throw new Error('API base URL is not configured');
            const res = await authFetch(`${API_BASE_URL}/api/service-requests/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to delete request');
            }
            return res.json();
        },
    },
};
