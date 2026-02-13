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
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {isOpen && (
        <nav className="mobile-nav">
          <a href="/services" onClick={closeMenu}>Services</a>
          <a href="/about" onClick={closeMenu}>About</a>
          <a href="/blog" onClick={closeMenu}>Blog</a>
          <a className="nav-cta" href="/contact" onClick={closeMenu}>Free Estimate</a>
        </nav>
      )}
    </>
  );
}
