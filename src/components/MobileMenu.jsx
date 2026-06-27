import React, { useEffect, useState } from 'react';

export default function MobileMenu({ pathname = '/' }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

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
              <a href="/services" className={isActive('/services') ? 'is-active' : ''} aria-current={isActive('/services') ? 'page' : undefined} onClick={closeMenu}>Services</a>
              <a href="/service-area" className={isActive('/service-area') ? 'is-active' : ''} aria-current={isActive('/service-area') ? 'page' : undefined} onClick={closeMenu}>Service Area</a>
              <a href="/our-work" className={isActive('/our-work') ? 'is-active' : ''} aria-current={isActive('/our-work') ? 'page' : undefined} onClick={closeMenu}>Our Work</a>
              <a href="/about" className={isActive('/about') ? 'is-active' : ''} aria-current={isActive('/about') ? 'page' : undefined} onClick={closeMenu}>About</a>
              <a href="/blog" className={isActive('/blog') ? 'is-active' : ''} aria-current={isActive('/blog') ? 'page' : undefined} onClick={closeMenu}>Blog</a>
            </div>

            <div className="mobile-nav-meta">
              <a href="/register" className={isActive('/register') ? 'is-active' : ''} aria-current={isActive('/register') ? 'page' : undefined} onClick={closeMenu}>Vehicle Registration</a>
              <a href="/portal/customer-login" className={isActive('/portal/customer-login') ? 'is-active' : ''} aria-current={isActive('/portal/customer-login') ? 'page' : undefined} onClick={closeMenu}>Customer Login</a>
            </div>

            <a className="nav-cta mobile-nav-cta" href="/contact" onClick={closeMenu}>Get Free Estimate</a>
          </nav>
        </>
      )}
    </>
  );
}
