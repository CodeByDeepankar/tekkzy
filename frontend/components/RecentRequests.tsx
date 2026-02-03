'use client';

import React, { useEffect, useState } from 'react';
import { Code } from 'lucide-react';
import Carousel from './Carousel';
import { API_BASE_URL } from '@/lib/api';

interface ContactRequest {
  name: string;
  service: string;
  message: string;
  email: string;
  submitted: string;
  imageUrl?: string | null;
}

export default function RecentRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!API_BASE_URL) {
          throw new Error('API base URL is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/api/contacts`);
        if (response.ok) {
           const data = await response.json();
           console.log('RecentRequests API Data:', data);
           if (Array.isArray(data)) {
               setRequests(data);
           }
        }
      } catch (error) {
        console.error("Failed to fetch requests", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
      return <div className="py-6 text-center text-slate-500 text-sm">Loading activity...</div>;
  }
  
  if (requests.length === 0) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const items = requests.map((req, index) => ({
      id: index,
      title: (
          <div className="flex flex-col items-start gap-3 w-full pt-4">
            <div className="flex items-center gap-3 w-full">
              <div className="h-12 w-12 rounded-full bg-slate-800/80 border border-slate-700/60 overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
                {req.imageUrl ? (
                  <img src={req.imageUrl} alt={req.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{getInitials(req.name || 'User')}</span>
                )}
              </div>
              <span className="text-3xl font-bold text-white truncate w-full tracking-tight">
                {req.name || 'Unknown User'}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-300 uppercase tracking-widest">
              {req.service}
            </span>
          </div>
      ),
      description: (
        <div className="flex flex-col h-full mt-4 min-h-[160px]">
            <div className="flex-1 flex items-center">
                 <p className="text-slate-300 text-lg leading-relaxed font-light line-clamp-4">
                    {req.message}
                </p>
            </div>
            
            <div className="text-slate-600 text-xs font-mono mt-6 pt-4 border-t border-slate-800/50 w-full">
                {req.submitted}
            </div>
        </div>
      ),
      icon: <Code className="carousel-icon w-6 h-6" />
  }));

  return (
    <div style={{ height: '600px', position: 'relative' }} className="w-full flex items-center justify-center">
      <Carousel
        items={items}
        baseWidth={320}
        autoplay={true}
        autoplayDelay={3000}
        pauseOnHover={true}
        loop={true}
        round={false}
      />
    </div>
  );
}
