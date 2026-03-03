'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const CHATBOT_API = 'https://deepbot-backend.vercel.app/api/v1/chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ServiceRequest {
  requestId: string;
  service: string;
  message: string;
  status: string;
  priority: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactRequest {
  contactId: string;
  name: string;
  service: string;
  message: string;
  submitted: string;
}

interface UserActivity {
  contactRequests: ContactRequest[];
  serviceRequests: ServiceRequest[];
  totalContacts: number;
  totalServiceRequests: number;
  contactServices: string[];
  requestServices: string[];
  statusSummary: Record<string, number>;
}

const QUICK_ACTIONS = [
  { label: '📋 My Requests', message: 'Show me a summary of all my service requests and their current status.' },
  { label: '🚀 Our Services', message: 'What services does Tekkzy offer?' },
  { label: '💬 Get a Quote', message: 'I want to get a quote for a project.' },
  { label: '🔄 Request Updates', message: 'Are there any updates or admin responses on my recent requests?' },
];

export default function ChatBot() {
  const { user, isAuthenticated } = useAuth();
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

  // Fetch user activity from AWS backend (contacts + service requests)
  const fetchUserActivity = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [contactData, serviceData] = await Promise.allSettled([
        api.contacts.mine(),
        api.serviceRequests.mine(),
      ]);

      const contacts: ContactRequest[] =
        contactData.status === 'fulfilled'
          ? Array.isArray(contactData.value) ? contactData.value : contactData.value.contacts || []
          : [];

      const serviceRequests: ServiceRequest[] =
        serviceData.status === 'fulfilled'
          ? Array.isArray(serviceData.value) ? serviceData.value : serviceData.value.requests || []
          : [];

      const contactServices = [...new Set(contacts.map(c => c.service).filter(Boolean))] as string[];
      const requestServices = [...new Set(serviceRequests.map(r => r.service).filter(Boolean))] as string[];

      // Build status summary
      const statusSummary: Record<string, number> = {};
      serviceRequests.forEach(r => {
        statusSummary[r.status] = (statusSummary[r.status] || 0) + 1;
      });

      setUserActivity({
        contactRequests: contacts.slice(0, 10),
        serviceRequests: serviceRequests.slice(0, 10),
        totalContacts: contacts.length,
        totalServiceRequests: serviceRequests.length,
        contactServices,
        requestServices,
        statusSummary,
      });
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen && isAuthenticated && !userActivity) {
      fetchUserActivity();
    }
  }, [isOpen, isAuthenticated, userActivity, fetchUserActivity]);

  // Welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let greeting: string;
      if (user?.name && userActivity && userActivity.totalServiceRequests > 0) {
        const pendingCount = userActivity.statusSummary['pending'] || 0;
        const inProgressCount = userActivity.statusSummary['in-progress'] || 0;
        const activeCount = pendingCount + inProgressCount;
        greeting = `Hi ${user.name.split(' ')[0]}! 👋 Welcome back to Tekkzy support. You have ${userActivity.totalServiceRequests} service request${userActivity.totalServiceRequests > 1 ? 's' : ''}${activeCount > 0 ? ` (${activeCount} active)` : ''}. How can I help you today?`;
      } else if (user?.name) {
        greeting = `Hi ${user.name.split(' ')[0]}! 👋 Welcome to Tekkzy support. I'm here to help you with our services, your account, or any project questions.`;
      } else {
        greeting = 'Hi! 👋 Welcome to Tekkzy support. How can I help you today?';
      }
      setMessages([
        {
          id: 'welcome',
          text: greeting,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, user?.name, userActivity]);

  const buildSystemContext = () => {
    let context = `You are Tekkzy Assistant, a helpful and personalized support chatbot for Tekkzy — a company that provides cloud-based software solutions, business automation, intelligent dashboards, digital marketing, and website maintenance services. 

STRICT RULES:
- Only answer questions related to Tekkzy's services, the user's account/activity, web development, cloud solutions, or general tech consulting topics.
- If someone asks about unrelated topics (politics, sports, personal advice, etc.), politely redirect them: "I'm here to help with Tekkzy's services and your account. Is there something I can assist you with regarding our solutions?"
- Be friendly, concise, and professional. Use short paragraphs.
- When discussing services, reference: Custom Cloud Software, Business Automation & Dashboards, Digital Marketing & Growth, Website Maintenance & Support.
- If the user wants to get started or get a quote, tell them to visit the Contact page or say you can help them outline their needs.
- IMPORTANT: You have access to the user's real service requests and contact data. Use this to give specific, personalized answers rather than generic ones. Quote request IDs, service names, statuses, and dates when relevant.

TEKKZY SERVICES DETAIL:
1. Custom Cloud-Based Software Solutions — SaaS development, data management, cloud migration, secure API development
2. Business Automation & Intelligent Dashboards — workflow automation, real-time analytics, inventory/HR management, CRM
3. Digital Marketing & Growth Support — SEO, social media, PPC, brand identity
4. Website Maintenance & Support — security updates, performance optimization, backups, troubleshooting`;

    if (user) {
      context += `\n\nCURRENT USER: ${user.name} (${user.email})`;
    }

    if (userActivity) {
      context += `\n\n===== USER DATA (use this to personalize every response) =====`;

      // Contact requests summary
      context += `\n\nCONTACT REQUESTS (${userActivity.totalContacts} total):`;
      if (userActivity.contactRequests.length > 0) {
        userActivity.contactRequests.forEach((c, i) => {
          context += `\n  ${i + 1}. Service: "${c.service}" | Message: "${c.message?.substring(0, 120)}${c.message?.length > 120 ? '...' : ''}" | ${c.submitted}`;
        });
      } else {
        context += `\n  No contact requests yet.`;
      }

      // Service requests with full details
      context += `\n\nSERVICE REQUESTS (${userActivity.totalServiceRequests} total):`;
      if (userActivity.serviceRequests.length > 0) {
        // Status overview
        const statusParts = Object.entries(userActivity.statusSummary).map(([s, n]) => `${s}: ${n}`);
        context += `\n  Status overview: ${statusParts.join(', ')}`;

        userActivity.serviceRequests.forEach((r, i) => {
          context += `\n  ${i + 1}. [${r.requestId.substring(0, 8)}] Service: "${r.service}" | Status: ${r.status.toUpperCase()} | Priority: ${r.priority}`;
          context += `\n     Message: "${r.message?.substring(0, 150)}${r.message?.length > 150 ? '...' : ''}"`;
          context += `\n     Created: ${new Date(r.createdAt).toLocaleDateString()} | Updated: ${new Date(r.updatedAt).toLocaleDateString()}`;
          if (r.adminResponse) {
            context += `\n     Admin Response: "${r.adminResponse.substring(0, 200)}${r.adminResponse.length > 200 ? '...' : ''}"`;
          }
        });
      } else {
        context += `\n  No service requests yet.`;
      }

      // Services the user is interested in
      const allServices = [...new Set([...userActivity.contactServices, ...userActivity.requestServices])];
      if (allServices.length > 0) {
        context += `\n\nSERVICES USER IS INTERESTED IN: ${allServices.join(', ')}`;
        context += `\nUse this to proactively suggest related services or updates.`;
      }

      context += `\n\nPERSONALIZATION GUIDELINES:`;
      context += `\n- Reference the user's actual requests by service name and status when relevant.`;
      context += `\n- If they ask about "my requests", list their real service requests with status and any admin responses.`;
      context += `\n- If a request has an admin response, share it. If not, let them know it's being reviewed.`;
      context += `\n- If they've shown interest in specific services, tailor recommendations around those.`;
      context += `\n- For status inquiries, give the exact status and last update date.`;
      context += `\n- If they have no requests yet, encourage them to submit one via the Service Request page.`;
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
                  {msg.sender === 'bot' ? (
                    <div className="chatbot-markdown">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
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
