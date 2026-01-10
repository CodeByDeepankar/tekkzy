
const BASE_URL = 'https://6uu73dgqj7.execute-api.us-east-1.amazonaws.com/dev';

type APIPayload = Record<string, unknown>;

export const api = {
  auth: {
    register: async (data: APIPayload) => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    login: async (data: APIPayload) => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
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
  expenses: {
    list: async (token: string) => {
      const res = await fetch(`${BASE_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
    create: async (token: string, data: APIPayload) => {
      const res = await fetch(`${BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Create Expense Error:', errorText);
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Failed to create expense');
        } catch {
            throw new Error(`Failed to create expense: ${res.statusText}`);
        }
      }
      return res.json();
    },
    update: async (token: string, id: string, data: APIPayload) => {
      const res = await fetch(`${BASE_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      return res.json();
    },
    delete: async (token: string, id: string) => {
      const res = await fetch(`${BASE_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      return res.json(); // May return success message or empty
    },
  },
};
