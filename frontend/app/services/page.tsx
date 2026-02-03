import Link from 'next/link';

export default function Services() {
  return (
    <main>
        <section className="section-header" style={{ paddingBottom: '40px', marginBottom: 0}}>
            <span className="subtitle" style={{marginTop: '60px', display: 'inline-block'}}>Our Expertise</span>
            <h2>Comprehensive Digital Solutions</h2>
            <p>We combine technical excellence with business strategy to deliver services that drive growth.</p>
        </section>

        <section style={{paddingTop: 0}}>
            <div className="container">
                <div className="services-grid" style={{gridTemplateColumns: '1fr', gap: '40px'}}>
                    
                    {/* Service 1 */}
                    <div className="service-card" style={{display: 'grid', gridTemplateColumns: '80px 1fr', gap: '30px', alignItems: 'start'}}>
                        <div className="service-icon" style={{marginBottom: 0}}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                        </div>
                        <div>
                            <h3>Custom Cloud-Based Software Solutions</h3>
                            <p>Every business has unique needs. We build scalable, secure, and custom software tailored to your specific operational requirements.</p>
                            <ul style={{marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• SaaS Application Development</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Data Management Systems</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Cloud Migration & Integration</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Secure API Development</li>
                            </ul>
                        </div>
                    </div>

                    {/* Service 2 */}
                    <div className="service-card" style={{display: 'grid', gridTemplateColumns: '80px 1fr', gap: '30px', alignItems: 'start'}}>
                        <div className="service-icon" style={{marginBottom: 0}}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                        </div>
                        <div>
                            <h3>Business Automation & Intelligent Dashboards</h3>
                            <p>Eliminate manual errors and save time. We create centralized dashboards that bring all your key metrics into one place.</p>
                            <ul style={{marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Workflow Automation Tools</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Real-time Analytics Dashboards</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Inventory & HR Management</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• CRM Implementations</li>
                            </ul>
                        </div>
                    </div>

                    {/* Service 3 */}
                    <div className="service-card" style={{display: 'grid', gridTemplateColumns: '80px 1fr', gap: '30px', alignItems: 'start'}}>
                        <div className="service-icon" style={{marginBottom: 0}}>
                           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>
                        </div>
                        <div>
                            <h3>Digital Marketing & Growth Support</h3>
                            <p>Building a great product is half the battle. We help you reach your audience through targeted digital strategies.</p>
                            <ul style={{marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• SEO & Content Strategy</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Social Media Management</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• PPC & Lead Generation</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Brand Identity Design</li>
                            </ul>
                        </div>
                    </div>

                    {/* Service 4 */}
                    <div className="service-card" style={{display: 'grid', gridTemplateColumns: '80px 1fr', gap: '30px', alignItems: 'start'}}>
                        <div className="service-icon" style={{marginBottom: 0}}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                        </div>
                        <div>
                            <h3>Website Maintenance & Support</h3>
                            <p>Digital assets require care. We provide ongoing maintenance to ensure your websites and apps run smoothly and securely.</p>
                            <ul style={{marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Security Updates & Patches</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Performance Optimization</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Regular Backups</li>
                                <li style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>• Technical Troubleshooting</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <section className="cta-section">
            <div className="container">
                <h2>Not sure what you need?</h2>
                <p>We offer consultation to assess your business needs and recommend the right path forward.</p>
                <Link href="/contact" className="btn btn-primary" style={{backgroundColor: 'var(--bg-white)', color: 'var(--primary-color)'}}>Talk to a Specialist</Link>
            </div>
        </section>
    </main>
  );
}
