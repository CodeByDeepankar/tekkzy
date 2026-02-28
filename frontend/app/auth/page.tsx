'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type AuthView = 'login' | 'register' | 'confirm';

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.register({ name, email, password });
      setSuccessMsg(res.message || 'Check your email for a verification code.');
      setView('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api.auth.confirm({ email, code: confirmationCode });
      setSuccessMsg('Email verified! You can now sign in.');
      setConfirmationCode('');
      setView('login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.resendCode({ email });
      setSuccessMsg(res.message || 'Verification code resent.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });

      if (res.needsConfirmation) {
        setError(res.message);
        setView('confirm');
        setLoading(false);
        return;
      }

      const token = res.token;
      const userData = { name: res.name || 'User', email: res.email || email };

      if (token) {
        login(token, userData, res.refreshToken);
        router.push('/contact');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      // Check if the error indicates the user needs confirmation
      if (message.includes('not verified') || message.includes('not confirmed')) {
        setView('confirm');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderAlert = () => (
    <>
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #fca5a5'
        }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{
          padding: '12px',
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #86efac'
        }}>
          {successMsg}
        </div>
      )}
    </>
  );

  return (
    <main>
      <section className="section-header" style={{ marginTop: '60px' }}>
        <span className="subtitle">Account Access</span>
        <h2>
          {view === 'login' && 'Welcome Back'}
          {view === 'register' && 'Join Tekkzy'}
          {view === 'confirm' && 'Verify Your Email'}
        </h2>
        <p>
          {view === 'login' && 'Sign in to access exclusive features.'}
          {view === 'register' && 'Create an account to get started.'}
          {view === 'confirm' && 'Enter the verification code sent to your email.'}
        </p>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="contact-form" style={{ maxWidth: '500px', margin: '0 auto' }}>
            {renderAlert()}

            {view === 'confirm' ? (
              <form onSubmit={handleConfirm}>
                <div className="form-group">
                  <label htmlFor="confirm-email">Email Address</label>
                  <input
                    type="email"
                    id="confirm-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code">Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--secondary-color)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.95rem',
                    }}
                  >
                    Resend Code
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                  Already verified?{' '}
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--secondary-color)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
                {view === 'register' && (
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {view === 'register' && (
                    <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      Min 8 characters, uppercase, lowercase, and number required.
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                  {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      setView(view === 'login' ? 'register' : 'login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--secondary-color)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {view === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
