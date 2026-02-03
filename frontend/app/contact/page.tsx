'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

interface ContactMessage {
    contactId: string;
    name: string;
    service: string;
    message: string;
    email: string;
    submitted: string;
    imageUrl?: string | null;
}

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();

  const fetchMessages = async () => {
    if (!isAuthenticated || !token) {
        setMessages([]);
        return;
    }

    try {
        if (!API_BASE_URL) {
            throw new Error('API base URL is not configured');
        }

        setMessagesLoading(true);
        setMessagesError(null);

        const response = await fetch(`${API_BASE_URL}/api/contacts/mine`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                setMessages([]);
            }
        } else {
            throw new Error('Failed to load messages');
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load messages';
        setMessagesError(message);
    } finally {
        setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [isAuthenticated, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const submitData: Record<string, unknown> = {
        name: formData.get('name'),
        email: formData.get('email'),
        service: formData.get('service'),
        message: formData.get('message')
    };
    
    try {
        if (!API_BASE_URL) {
            throw new Error('API base URL is not configured');
        }

        if (imageFile) {
            setIsUploading(true);
            setUploadError(null);

            const presignResponse = await fetch(`${API_BASE_URL}/api/uploads/presign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: imageFile.name,
                    contentType: imageFile.type
                })
            });

            if (!presignResponse.ok) {
                const err = await presignResponse.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to get upload URL');
            }

            const { uploadUrl, key } = await presignResponse.json();

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': imageFile.type
                },
                body: imageFile
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            submitData.imageKey = key;
        }

        const response = await fetch(`${API_BASE_URL}/api/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(submitData)
        });

        if (response.ok) {
            alert('Thank you for contacting Tekkzy! We have received your message and will get back to you shortly.');
            form.reset();
            setImageFile(null);
            setUploadPreview(null);
            fetchMessages();
        } else {
            console.error('Submission failed');
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        const message = error instanceof Error ? error.message : 'Failed to send message';
        setUploadError(message);
        alert('Error sending message. Please check your connection.');
    } finally {
        setIsUploading(false);
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!token) return;

    try {
        if (!API_BASE_URL) {
            throw new Error('API base URL is not configured');
        }

        setDeletingId(contactId);

        const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            setMessages((prev) => prev.filter((item) => item.contactId !== contactId));
        } else {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Failed to delete message');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        const message = error instanceof Error ? error.message : 'Unable to delete the message.';
        alert(message);
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <main>
        <section className="section-header" style={{marginTop: '60px'}}>
            <span className="subtitle">Get in Touch</span>
            <h2>Let&apos;s Build Something Great</h2>
            <p>Have a project in mind or need assistance? Reach out to our team today.</p>
        </section>

        <section style={{paddingTop: 0}}>
            <div className="container">
                <div className="contact-grid">
                    
                    <div className="contact-info-card">
                        <div className="info-item">
                            <h4>Corporate Headquarters</h4>
                            <p>Bhubaneswar, Odisha, India</p>
                            <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '4px'}}>Registered Office</p>
                        </div>
                        
                        <div className="info-item">
                            <h4>Email Us</h4>
                            <p>info@tekkzy.com</p>
                            <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '4px'}}>For general inquiries & support</p>
                        </div>

                        <div className="info-item">
                            <h4>Call Us</h4>
                            <p>+91 (000) 000-0000</p>
                            <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '4px'}}>Mon - Fri, 9am - 6pm IST</p>
                        </div>

                        <hr style={{border: 0, borderTop: '1px solid var(--border-color)', margin: '30px 0'}} />

                        <div className="legal-box" style={{margin: 0, padding: '20px', fontSize: '0.9rem'}}>
                            <p><strong>Legal Entity:</strong><br/>Tekkzy Intelligent Cloud Applications Pvt. Ltd.</p>
                            <p style={{marginTop: '8px'}}><strong>CIN:</strong><br/>U62013OD2025PTC049193</p>
                        </div>
                    </div>

                    <div className="contact-form">
                        <h3 style={{marginBottom: '24px', color: 'var(--primary-color)'}}>Send us a Message</h3>
                        
                        {isAuthenticated ? (
                            <><form onSubmit={handleSubmit}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                      <div className="form-group">
                                          <label htmlFor="name">Full Name</label>
                                          <input type="text" id="name" name="name" placeholder="John Doe" required />
                                      </div>
                                      <div className="form-group">
                                          <label htmlFor="email">Email Address</label>
                                          <input type="email" id="email" name="email" placeholder="john@company.com" required />
                                      </div>
                                  </div>

                                  <div className="form-group">
                                      <label htmlFor="service">Service Interest</label>
                                      <select id="service" name="service">
                                          <option value="">Select a service...</option>
                                          <option value="custom cloud software">Custom Cloud Software</option>
                                          <option value="business automation">Business Automation</option>
                                          <option value="digital marketing">Digital Marketing</option>
                                          <option value="general consultation">General Consultation</option>
                                          <option value="other">Other</option>
                                      </select>
                                  </div>

                                  <div className="form-group">
                                      <label htmlFor="message">Your Message</label>
                                      <textarea id="message" name="message" rows={5} placeholder="Tell us about your project or inquiry..." required></textarea>
                                  </div>

                                  <div className="form-group">
                                      <label htmlFor="profileImage">Upload Profile Image</label>
                                      <input
                                          type="file"
                                          id="profileImage"
                                          name="profileImage"
                                          accept="image/*"
                                          onChange={(event) => {
                                              const file = event.target.files?.[0] || null;
                                              setImageFile(file);
                                              setUploadError(null);
                                              if (file) {
                                                  setUploadPreview(URL.createObjectURL(file));
                                              } else {
                                                  setUploadPreview(null);
                                              }
                                          } } />
                                      {uploadPreview && (
                                          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                              <img
                                                  src={uploadPreview}
                                                  alt="Preview"
                                                  style={{ width: '56px', height: '56px', borderRadius: '999px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                                              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                                  This image will appear with your message.
                                              </span>
                                          </div>
                                      )}
                                      {uploadError && (
                                          <p style={{ color: '#b91c1c', marginTop: '8px', fontSize: '0.9rem' }}>{uploadError}</p>
                                      )}
                                  </div>

                                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting || isUploading}>
                                      {isSubmitting ? 'Sending...' : (isUploading ? 'Uploading...' : 'Send Message')}
                                  </button>
                              </form><div style={{ marginTop: '40px' }}>
                                      <h4 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>Your Messages</h4>
                                      {messagesLoading && (
                                          <p style={{ color: 'var(--text-light)' }}>Loading your messages...</p>
                                      )}
                                      {messagesError && (
                                          <p style={{ color: '#b91c1c' }}>{messagesError}</p>
                                      )}
                                      {!messagesLoading && !messagesError && messages.length === 0 && (
                                          <p style={{ color: 'var(--text-light)' }}>No messages yet. Send one above to get started.</p>
                                      )}
                                      <div style={{ display: 'grid', gap: '16px' }}>
                                          {messages.map((msg) => (
                                              <div
                                                  key={msg.contactId}
                                                  style={{
                                                      border: '1px solid var(--border-color)',
                                                      borderRadius: '14px',
                                                      padding: '16px',
                                                      background: 'var(--bg-white)'
                                                  }}
                                              >
                                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                                      <div>
                                                          <h5 style={{ marginBottom: '6px' }}>{msg.service}</h5>
                                                          <p style={{ color: 'var(--text-light)', marginBottom: '10px' }}>{msg.message}</p>
                                                          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{msg.submitted}</span>
                                                      </div>
                                                      <button
                                                          type="button"
                                                          className="btn btn-outline"
                                                          onClick={() => handleDelete(msg.contactId)}
                                                          disabled={deletingId === msg.contactId}
                                                          style={{ whiteSpace: 'nowrap' }}
                                                      >
                                                          {deletingId === msg.contactId ? 'Deleting...' : 'Delete'}
                                                      </button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div></>
                        ) : (
                            <div style={{textAlign: 'center', padding: '40px 0'}}>
                                <div style={{fontSize: '3rem', marginBottom: '20px'}}>🔒</div>
                                <h4 style={{marginBottom: '10px', color: 'var(--primary-color)'}}>Authentication Required</h4>
                                <p style={{color: 'var(--text-light)', marginBottom: '30px'}}>Please log in to your account to send us a message.</p>
                                <Link href="/auth" className="btn btn-primary">
                                    Log In to Contact
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    </main>
  );
}
