
import { signUp, confirmSignUp, resendSignUpCode, signIn, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type APIPayload = Record<string, unknown>;

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

export const api = {
  auth: {
    register: async (data: APIPayload) => {
      const { name, email, password } = data as { name: string; email: string; password: string };
      const result = await signUp({
        username: email.toLowerCase(),
        password,
        options: {
          userAttributes: {
            email: email.toLowerCase(),
            name,
          },
        },
      });
      return {
        message: 'Registration successful. Please check your email for a verification code.',
        userSub: result.userId,
        email: email.toLowerCase(),
        confirmed: result.isSignUpComplete,
      };
    },
    confirm: async (data: APIPayload) => {
      const { email, code } = data as { email: string; code: string };
      await confirmSignUp({
        username: email.toLowerCase(),
        confirmationCode: code,
      });
      return { message: 'Email verified successfully. You can now log in.' };
    },
    resendCode: async (data: APIPayload) => {
      const { email } = data as { email: string };
      await resendSignUpCode({
        username: email.toLowerCase(),
      });
      return { message: 'Verification code resent. Please check your email.' };
    },
    login: async (data: APIPayload) => {
      const { email, password } = data as { email: string; password: string };
      const result = await signIn({
        username: email.toLowerCase(),
        password,
      });

      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        return {
          needsConfirmation: true,
          message: 'Account not verified. Please check your email for the verification code.',
        };
      }

      // Fetch the session tokens
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString() || '';
      const accessToken = session.tokens?.accessToken?.toString() || '';
      const payload = session.tokens?.idToken?.payload;

      return {
        _id: payload?.sub || '',
        name: (payload?.name as string) || '',
        email: (payload?.email as string) || email.toLowerCase(),
        token: idToken,
        accessToken,
      };
    },
    forgotPassword: async (data: APIPayload) => {
      const { email } = data as { email: string };
      await resetPassword({
        username: email.toLowerCase(),
      });
      return {
        message: 'Password reset code sent. Please check your email.',
        email: email.toLowerCase(),
      };
    },
    confirmForgotPassword: async (data: APIPayload) => {
      const { email, code, newPassword } = data as { email: string; code: string; newPassword: string };
      await confirmResetPassword({
        username: email.toLowerCase(),
        confirmationCode: code,
        newPassword,
      });
      return { message: 'Password reset successful. You can now sign in with your new password.' };
    },
  },
  contacts: {
    list: async () => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await authFetch(`${API_BASE_URL}/api/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    mine: async (token?: string) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      // token param kept for backward compat, but we use Amplify session
      const res = await authFetch(`${API_BASE_URL}/api/contacts/mine`);
      if (!res.ok) throw new Error('Failed to fetch your contacts');
      return res.json();
    },
    create: async (token: string, data: APIPayload) => {
      if (!API_BASE_URL) throw new Error('API base URL is not configured');
      const res = await authFetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await authFetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await authFetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'DELETE',
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
      const res = await authFetch(`${API_BASE_URL}/api/uploads/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
