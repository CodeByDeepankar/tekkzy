'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const CHATBOT_API = 'https://deepbot-backend.vercel.app/api/v1/chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UserActivity {
  contactRequests: number;
  recentServices: string[];
}

const QUICK_ACTIONS = [
  { label: 'Our Services', message: 'What services does Tekkzy offer?' },
  { label: 'Get a Quote', message: 'I want to get a quote for a project.' },
  { label: 'My Requests', message: 'Can you tell me about my recent contact requests?' },
];

export default function ChatBot() {
  const { user, token, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch user activity from AWS backend
  const fetchUserActivity = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.contacts.mine(token);
      const contacts = Array.isArray(data) ? data : data.contacts || [];
      const services = [...new Set(contacts.map((c: { service?: string }) => c.service).filter(Boolean))] as string[];
      setUserActivity({
        contactRequests: contacts.length,
        recentServices: services.slice(0, 5),
      });
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && isAuthenticated && !userActivity) {
      fetchUserActivity();
    }
  }, [isOpen, isAuthenticated, userActivity, fetchUserActivity]);

  // Welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = user?.name
        ? `Hi ${user.name.split(' ')[0]}! 👋 Welcome to Tekkzy support. I'm here to help you with our services, your account, or any project questions.`
        : 'Hi! 👋 Welcome to Tekkzy support. How can I help you today?';
      setMessages([
        {
          id: 'welcome',
          text: greeting,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, user?.name]);

  const buildSystemContext = () => {
    let context = `You are Tekkzy Assistant, a helpful support chatbot for Tekkzy — a company that provides cloud-based software solutions, business automation, intelligent dashboards, digital marketing, and website maintenance services. 

STRICT RULES:
- Only answer questions related to Tekkzy's services, the user's account/activity, web development, cloud solutions, or general tech consulting topics.
- If someone asks about unrelated topics (politics, sports, personal advice, etc.), politely redirect them: "I'm here to help with Tekkzy's services and your account. Is there something I can assist you with regarding our solutions?"
- Be friendly, concise, and professional. Use short paragraphs.
- When discussing services, reference: Custom Cloud Software, Business Automation & Dashboards, Digital Marketing & Growth, Website Maintenance & Support.
- If the user wants to get started or get a quote, tell them to visit the Contact page or say you can help them outline their needs.

TEKKZY SERVICES DETAIL:
1. Custom Cloud-Based Software Solutions — SaaS development, data management, cloud migration, secure API development
2. Business Automation & Intelligent Dashboards — workflow automation, real-time analytics, inventory/HR management, CRM
3. Digital Marketing & Growth Support — SEO, social media, PPC, brand identity
4. Website Maintenance & Support — security updates, performance optimization, backups, troubleshooting`;

    if (user) {
      context += `\n\nCURRENT USER: ${user.name} (${user.email})`;
    }

    if (userActivity) {
      context += `\n\nUSER ACTIVITY:`;
      context += `\n- Total contact/service requests: ${userActivity.contactRequests}`;
      if (userActivity.recentServices.length > 0) {
        context += `\n- Services they've inquired about: ${userActivity.recentServices.join(', ')}`;
      }
      context += `\nUse this info to personalize responses. For example, if they've submitted requests, acknowledge that.`;
    }

    return context;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuickActions(false);
    setIsLoading(true);

    try {
      const systemContext = buildSystemContext();
      const fullMessage = `[System Instructions: ${systemContext}]\n\nUser: ${text.trim()}`;

      const res = await fetch(CHATBOT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage }),
      });

      const data = await res.json();

      if (data.success && data.data?.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: data.data.reply,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble connecting right now. Please try again or reach out via our Contact page.",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="chatbot-fab"
        aria-label="Open chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && <span className="chatbot-fab-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <circle cx="9" cy="15" r="1" />
                  <circle cx="15" cy="15" r="1" />
                </svg>
              </div>
              <div>
                <h4 className="chatbot-header-title">Tekkzy Assistant</h4>
                <span className="chatbot-header-status">
                  <span className="chatbot-status-dot" />
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chatbot-close-btn" aria-label="Close chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg-${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="chatbot-msg-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                      <rect x="4" y="10" width="16" height="10" rx="2" />
                    </svg>
                  </div>
                )}
                <div className={`chatbot-bubble chatbot-bubble-${msg.sender}`}>
                  <p>{msg.text}</p>
                  <span className="chatbot-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <div className="chatbot-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                  </svg>
                </div>
                <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
              <div className="chatbot-quick-actions">
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} onClick={() => handleQuickAction(action.message)} className="chatbot-quick-btn">
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="chatbot-input"
              disabled={isLoading}
            />
            <button type="submit" className="chatbot-send-btn" disabled={isLoading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Footer */}
          <div className="chatbot-footer">
            <span>Powered by <strong>Tekkzy AI</strong></span>
          </div>
        </div>
      )}
    </>
  );
}
