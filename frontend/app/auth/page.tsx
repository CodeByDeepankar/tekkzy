'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { signOut } from 'aws-amplify/auth';

type AuthView = 'login' | 'register' | 'confirm' | 'forgot-password' | 'reset-password';

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
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Sign out any existing session first to avoid "already signed in" errors
      try { await signOut(); } catch { /* ignore */ }
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
      // Sign out any stale session before attempting login
      try { await signOut(); } catch { /* ignore */ }
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
        login(token, userData);
        router.push('/contact');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      if (message.includes('not verified') || message.includes('not confirmed') || message.includes('CONFIRM_SIGN_UP')) {
        setView('confirm');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword({ email });
      setSuccessMsg(res.message || 'Reset code sent. Check your email.');
      setView('reset-password');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.auth.confirmForgotPassword({ email, code: resetCode, newPassword });
      setSuccessMsg(res.message || 'Password reset successful. You can now sign in.');
      setNewPassword('');
      setResetCode('');
      setView('login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
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
          {view === 'forgot-password' && 'Forgot Password'}
          {view === 'reset-password' && 'Reset Password'}
        </h2>
        <p>
          {view === 'login' && 'Sign in to access exclusive features.'}
          {view === 'register' && 'Create an account to get started.'}
          {view === 'confirm' && 'Enter the verification code sent to your email.'}
          {view === 'forgot-password' && 'Enter your email to receive a password reset code.'}
          {view === 'reset-password' && 'Enter the reset code and your new password.'}
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
            ) : view === 'forgot-password' ? (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email Address</label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                  Remember your password?{' '}
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
                    Back to Sign in
                  </button>
                </div>
              </form>
            ) : view === 'reset-password' ? (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-code">Reset Code</label>
                  <input
                    type="text"
                    id="reset-code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                    Min 8 characters, uppercase, lowercase, and number required.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }}
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
                  Remember your password?{' '}
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
                    Back to Sign in
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {view === 'register' && (
                    <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      Min 8 characters, uppercase, lowercase, and number required.
                    </small>
                  )}
                </div>

                {view === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--secondary-color)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.9rem',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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
