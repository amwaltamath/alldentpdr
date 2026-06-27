import React, { useEffect, useState } from 'react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMenu}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
      >
        <span className="mobile-menu-toggle-lines" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span className="mobile-menu-toggle-label">Menu</span>
      </button>
      
      {isOpen && (
        <>
          <button type="button" className="mobile-nav-backdrop" onClick={closeMenu} aria-label="Close navigation menu" />
          <nav id="mobile-nav-drawer" className="mobile-nav" role="navigation" aria-label="Mobile navigation">
            <div className="mobile-nav-head">
              <div>
                <p className="mobile-nav-kicker">All Dent PDR</p>
                <h3>Navigation</h3>
              </div>
              <button type="button" className="mobile-nav-close" onClick={closeMenu} aria-label="Close navigation menu">✕</button>
            </div>

            <div className="mobile-nav-links">
              <a href="/services" onClick={closeMenu}>Services</a>
              <a href="/service-area" onClick={closeMenu}>Service Area</a>
              <a href="/our-work" onClick={closeMenu}>Our Work</a>
              <a href="/about" onClick={closeMenu}>About</a>
              <a href="/blog" onClick={closeMenu}>Blog</a>
            </div>

            <div className="mobile-nav-meta">
              <a href="/register" onClick={closeMenu}>Vehicle Registration</a>
              <a href="/portal/customer-login" onClick={closeMenu}>Customer Login</a>
            </div>

            <a className="nav-cta mobile-nav-cta" href="/contact" onClick={closeMenu}>Get Free Estimate</a>
          </nav>
        </>
      )}
    </>
  );
}
