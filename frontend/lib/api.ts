
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type APIPayload = Record<string, unknown>;

export const api = {
  auth: {
    register: async (data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      return res.json();
    },
    confirm: async (data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Confirmation failed');
      }
      return res.json();
    },
    resendCode: async (data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to resend code');
      }
      return res.json();
    },
    login: async (data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); 
        throw new Error(errorData.message || 'Login failed');
      }
      return res.json();
    },
  },
  contacts: {
    list: async () => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    mine: async (token: string) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/contacts/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch your contacts');
      return res.json();
    },
    create: async (token: string, data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create contact');
      }
      return res.json();
    },
    update: async (token: string, id: string, data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update contact');
      }
      return res.json();
    },
    delete: async (token: string, id: string) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete contact');
      }
      return res.json();
    },
  },
  uploads: {
    presign: async (token: string, data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await fetch(`${API_BASE_URL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get upload URL');
      }
      return res.json();
    },
  },
};
