import Link from 'next/link';
import RecentRequests from '@/components/RecentRequests';

export default function Home() {
    return (
        <>
            <section className="hero">
                <div className="container hero-content">
                    <span className="hero-label">Intelligent Cloud Solutions</span>
                    <h1>Empowering Business Through Digital Innovation</h1>
                    <p>Tekkzy enables businesses to digitize, automate, and scale with confidence. Start your transformation today.</p>
                    <div className="hero-btns">
                        <Link href="/services" className="btn btn-primary">Explore Services</Link>
                        <Link href="/contact" className="btn btn-outline">Schedule Consultation</Link>
                    </div>
                </div>
            </section>

            <section className="about-section">

                <div className="container">
                    <div className="about-grid">
                        <div className="about-image">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" alt="Team meeting in a modern office" />
                        </div>
                        <div className="about-text">
                            <span className="section-badge" style={{ color: 'var(--secondary-color)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '1px' }}>Who We Are</span>
                            <h3>Trusted Technology Partner for Modern Enterprises</h3>
                            <p style={{ marginBottom: '20px' }}>Tekkzy Intelligent Cloud Applications Private Limited is a forward-thinking technology company focused on simplifying complex business challenges through smart digital solutions.</p>

                            <div className="legal-box">
                                <p><strong>Registered Company:</strong> Tekkzy Intelligent Cloud Applications Pvt. Ltd.</p>
                                <p><strong>CIN:</strong> U62013OD2025PTC049193</p>
                                <p><strong>Registered Under:</strong> RoC-Cuttack</p>
                                <p><strong>Founded:</strong> 2025</p>
                            </div>

                            <Link href="/about" style={{ color: 'var(--secondary-color)', fontWeight: 600, textDecoration: 'underline' }}>Learn more about our mission &rarr;</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="services-section">
                <div className="container">
                    <div className="section-header">
                        <span className="subtitle">Our Capabilities</span>
                        <h2>Solutions Designed for Growth</h2>
                        <p>We deliver end-to-end digital services that streamline operations and drive results.</p>
                    </div>

                    <div className="services-grid">
                        <div className="service-card">
                            <div className="service-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                            </div>
                            <h3>Custom Cloud Software</h3>
                            <p>Tailored systems designed to streamline business operations, improve reporting, and secure your data management.</p>
                        </div>

                        <div className="service-card">
                            <div className="service-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            </div>
                            <h3>Intelligent Dashboards</h3>
                            <p>Centralized interfaces to automate routine tasks and provide real-time insights for data-driven decisions.</p>
                        </div>

                        <div className="service-card">
                            <div className="service-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>
                            </div>
                            <h3>Digital Growth</h3>
                            <p>Strategic digital marketing to expand your online presence, reach new customers, and boost brand visibility.</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link href="/services" className="btn btn-primary">View All Services</Link>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                        <div className="flex-1 text-left">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Business?</h2>
                            <p style={{ margin: '0 0 40px 0', maxWidth: '100%' }} className="text-xl text-slate-300">Let&apos;s discuss how Tekkzy can help you achieve your digital goals.</p>
                            <Link href="/contact" className="btn btn-primary" style={{ backgroundColor: 'var(--bg-white)', color: 'var(--primary-color)' }}>Get a Free Consultation</Link>
                        </div>
                        
                        <div className="flex-1 w-full min-h-[600px] relative flex items-center justify-center">
                            <RecentRequests />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
