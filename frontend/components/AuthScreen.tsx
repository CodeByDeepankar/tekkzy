'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

type AuthView = 'login' | 'register' | 'confirm' | 'forgot-password' | 'reset-password';

export function AuthScreen() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();
  
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
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      if (message.includes('not verified') || message.includes('not confirmed')) {
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

  const getTitle = () => {
    switch (view) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'confirm': return 'Verify Email';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'login': return 'Enter your credentials to access your account';
      case 'register': return 'Enter your information to create an account';
      case 'confirm': return 'Enter the verification code sent to your email';
      case 'forgot-password': return 'Enter your email to receive a password reset code';
      case 'reset-password': return 'Enter the reset code and your new password';
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 overflow-hidden bg-background">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 w-full h-full"> 
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        </div>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center z-10"
      >
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Daily Spend</h1>
        <p className="text-muted-foreground">Master your finances with elegance.</p>
      </motion.div>

      <Card className="w-full max-w-md backdrop-blur-md bg-card/80 border-border/50 z-10 relative overflow-hidden">
        <AnimatePresence mode='wait'>
            <motion.div
                key={view}
                initial={{ opacity: 0, x: view === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === 'login' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
            >
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
                    <CardDescription className="text-center">{getDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                        {error}
                    </div>
                    )}
                    {successMsg && (
                    <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-lg border border-emerald-500/20">
                        {successMsg}
                    </div>
                    )}

                    {view === 'confirm' ? (
                      <form onSubmit={handleConfirm} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="confirm-email">Email Address</Label>
                          <Input
                            id="confirm-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Verification Code</Label>
                          <Input
                            id="code"
                            type="text"
                            placeholder="123456"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value)}
                            required
                            autoComplete="one-time-code"
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                          >
                            Resend Code
                          </button>
                        </div>
                      </form>
                    ) : view === 'forgot-password' ? (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email Address</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          {loading ? 'Sending...' : 'Send Reset Code'}
                        </Button>
                      </form>
                    ) : view === 'reset-password' ? (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email Address</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reset-code">Reset Code</Label>
                          <Input
                            id="reset-code"
                            type="text"
                            placeholder="123456"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            required
                            autoComplete="one-time-code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Min 8 characters, uppercase, lowercase, and number required.
                          </p>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }}
                            disabled={loading}
                            className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                          >
                            Resend Code
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
                        {view === 'register' && (
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {view === 'register' && (
                            <p className="text-xs text-muted-foreground">
                              Min 8 characters, uppercase, lowercase, and number required.
                            </p>
                          )}
                        </div>

                        {view === 'login' && (
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }}
                              className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                            >
                              Forgot Password?
                            </button>
                          </div>
                        )}

                        <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
                        </Button>
                      </form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="text-center text-sm text-muted-foreground w-full">
                        {view === 'confirm' ? (
                          <>
                            Already verified?{' '}
                            <button
                              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                              className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                            >
                              Sign in
                            </button>
                          </>
                        ) : view === 'forgot-password' || view === 'reset-password' ? (
                          <>
                            Remember your password?{' '}
                            <button
                              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                              className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                            >
                              Back to Sign in
                            </button>
                          </>
                        ) : (
                          <>
                            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                              onClick={() => {
                                setView(view === 'login' ? 'register' : 'login');
                                setError('');
                                setSuccessMsg('');
                              }}
                              className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                            >
                              {view === 'login' ? 'Register' : 'Login'}
                            </button>
                          </>
                        )}
                    </div>
                </CardFooter>
            </motion.div>
        </AnimatePresence>
      </Card>
      
      <div className="absolute bottom-4 text-xs text-muted-foreground/50 z-10">
        © 2026 Daily Spend Inc. All rights reserved.
      </div>
    </div>
  );
}
