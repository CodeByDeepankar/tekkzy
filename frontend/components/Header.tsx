'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => pathname === path ? 'active' : '';

  return (
    <header>
        <div className="container navbar">
            <Link href="/" className="logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="6" fill="#a1bbf9"/>
                    <path d="M8 10H16M8 16H24M8 22H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Tekkzy
            </Link>
            <nav>
                <button 
                  className="mobile-menu-btn" 
                  aria-label="Toggle navigation"
                  onClick={toggleMenu}
                >
                    ☰
                </button>
                <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <li><Link href="/" className={isActive('/')} onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                    <li><Link href="/about" className={isActive('/about')} onClick={() => setIsMenuOpen(false)}>About Us</Link></li>
                    <li><Link href="/services" className={isActive('/services')} onClick={() => setIsMenuOpen(false)}>Services</Link></li>
                    <li><Link href="/contact" className={isActive('/contact')} onClick={() => setIsMenuOpen(false)}>Contact Us</Link></li>
                    {isAuthenticated ? (
                      <li>
                        <button 
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="contact-btn-nav"
                          style={{ border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}
                        >
                          Logout
                        </button>
                      </li>
                    ) : (
                      <li><Link href="/auth" className={`contact-btn-nav ${isActive('/auth')}`} onClick={() => setIsMenuOpen(false)}>Login</Link></li>
                    )}
                </ul>
            </nav>
        </div>
    </header>
  );
}
