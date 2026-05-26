import React, { useState } from 'react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {isOpen && (
        <nav className="mobile-nav" role="navigation">
          <a href="/services" onClick={closeMenu}>Services</a>
          <a href="/our-work" onClick={closeMenu}>Our Work</a>
          <a href="/service-area" onClick={closeMenu}>Service Area</a>
          <a href="/about" onClick={closeMenu}>About</a>
          <a href="/blog" onClick={closeMenu}>Blog</a>
          <a href="/register" onClick={closeMenu}>Register</a>
          <a href="/portal/customer-login" onClick={closeMenu}>Login</a>
          <a className="nav-cta" href="/contact" onClick={closeMenu}>Get Free Estimate</a>
        </nav>
      )}
    </>
  );
}
