'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  
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
        const userData = res.user || { name: res.name || 'User', email: res.email || email };
        const token = res.token || res.access_token; 
        
        if (token) {
           login(token, userData);
        } else {
           throw new Error("Invalid response from server");
        }

      } else {
        const res = await api.auth.register({ name, email, password });
        if (res.token) {
           login(res.token, res.user || { name, email });
        } else {
           setIsLogin(true);
           alert('Registration successful! Please login.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
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
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
            >
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                    </CardTitle>
                    <CardDescription className="text-center">
                    {isLogin ? 'Enter your credentials to access your account' : 'Enter your information to create an account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                        {error}
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLogin}
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
                        <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="text-center text-sm text-muted-foreground w-full">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors hover:underline"
                        >
                        {isLogin ? 'Register' : 'Login'}
                        </button>
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
