'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        // Adapt response to match what AuthContext expects
        // The api.ts likely returns the user object directly or a wrapper
        // Based on AuthScreen.tsx: 
        // const userData = res.user || { name: res.name || 'User', email: res.email || email };
        // const token = res.token || res.access_token;
        
        const token = res.token || res.access_token;
        const userData = res.user || { name: res.name || 'User', email: res.email || email };

        if (token) {
           login(token, userData);
           router.push('/contact'); // Redirect to contact page after login
        } else {
           throw new Error("Invalid response from server");
        }

      } else {
        const res = await api.auth.register({ name, email, password });
        if (res.token) {
           login(res.token, res.user || { name, email });
           router.push('/contact');
        } else {
           // If registration doesn't return a token immediately (e.g. requires verification), 
           // just switch to login. But standard JWT auth usually returns token.
           setIsLogin(true);
           alert('Registration successful! Please login.');
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
        <section className="section-header" style={{marginTop: '60px'}}>
            <span className="subtitle">Account Access</span>
            <h2>{isLogin ? 'Welcome Back' : 'Join Tekkzy'}</h2>
            <p>{isLogin ? 'Sign in to access exclusive features.' : 'Create an account to get started.'}</p>
        </section>

        <section style={{paddingTop: 0}}>
            <div className="container">
                <div className="contact-form" style={{maxWidth: '500px', margin: '0 auto'}}>
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
                    
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe" 
                                    required={!isLogin} 
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
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{width: '100%', marginTop: '10px'}} 
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>

                        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.95rem', color: 'var(--text-light)'}}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
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
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    </main>
  );
}
