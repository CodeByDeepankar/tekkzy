'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';

function HomeContent() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Dashboard />;
  }
  
  return <AuthScreen />;
}

export default function Home() {
  return (
    <AuthProvider>
       <HomeContent />
    </AuthProvider>
  );
}
