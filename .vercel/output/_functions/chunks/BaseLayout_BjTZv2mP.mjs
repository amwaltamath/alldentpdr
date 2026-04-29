import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { r as renderTemplate, n as renderSlot, l as renderComponent, p as renderHead, u as unescapeHTML, q as Fragment$1, h as addAttribute } from './entrypoint_Dt5qyCpC.mjs';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { useState } from 'react';

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        className: "mobile-menu-toggle",
        onClick: toggleMenu,
        "aria-label": "Toggle navigation menu",
        "aria-expanded": isOpen,
        children: [
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {})
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("nav", { className: "mobile-nav", role: "navigation", children: [
      /* @__PURE__ */ jsx("a", { href: "/services", onClick: closeMenu, children: "Services" }),
      /* @__PURE__ */ jsx("a", { href: "/about", onClick: closeMenu, children: "About" }),
      /* @__PURE__ */ jsx("a", { href: "/blog", onClick: closeMenu, children: "Blog" }),
      /* @__PURE__ */ jsx("a", { href: "/register", onClick: closeMenu, children: "Vehicle Registration" }),
      /* @__PURE__ */ jsx("a", { href: "/portal/customer-login", onClick: closeMenu, children: "Customer Login" }),
      /* @__PURE__ */ jsx("a", { className: "nav-cta", href: "/contact", onClick: closeMenu, children: "Request Inspection" })
    ] })
  ] });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b, _c, _d;
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "AllDent PDR | Paintless Dent Repair Cincinnati",
    description = "Mobile paintless dent repair based in Cincinnati. We travel nationwide to repair hail storm damage on-site. Fast, affordable PDR for door dings, hail damage, and minor collision dents.",
    canonical = "https://alldentpdr.com",
    ogImage = "/images/logo-branded.svg",
    noindex = false,
    type = "website",
    publishedDate = "",
    bare = false,
    breadcrumbs = [],
    faqItems = []
  } = Astro2.props;
  const gaId = "G-T7RLXD05RW";
  return renderTemplate(_d || (_d = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', "><title>", '</title><meta name="description"', '><link rel="canonical"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:image:alt" content="AllDent PDR - Paintless Dent Repair"><meta name="google-site-verification" content="UdUBGJ6CT7WTj7DlCdAeVQ0JqiMupWXbQ9hrj3ZiUwY">', '<meta name="geo.region" content="US-OH"><meta name="geo.placename" content="Cincinnati"><meta name="geo.position" content="39.1031;-84.5120"><meta name="ICBM" content="39.1031, -84.5120">', '<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/images/logo.jpg"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#b0522b"><!-- Google Analytics -->', '<!-- Structured Data for Local SEO --><script type="application/ld+json">\n      {`\n        {\n          "@context": "https://schema.org",\n          "@type": "AutoRepair",\n          "name": "AllDent PDR",\n          "description": "Mobile paintless dent repair based in Cincinnati. We travel across the U.S. to repair hail storm damage on-site.",\n          "url": "https://alldentpdr.com",\n          "telephone": "1-855-425-5336",\n          "email": "alldentpdr@gmail.com",\n          "address": {\n            "@type": "PostalAddress",\n            "addressLocality": "Cincinnati",\n            "addressRegion": "OH",\n            "addressCountry": "US"\n          },\n          "areaServed": [\n            {\n              "@type": "City",\n              "name": "Cincinnati"\n            },\n            {\n              "@type": "Country",\n              "name": "United States"\n            }\n          ],\n          "geo": {\n            "@type": "GeoCoordinates",\n            "latitude": 39.1031,\n            "longitude": -84.5120\n          },\n          "hasOfferCatalog": {\n            "@type": "OfferCatalog",\n            "name": "Paintless Dent Repair Services",\n            "itemListElement": [\n              {\n                "@type": "OfferCatalog",\n                "name": "Door Ding Repair",\n                "description": "Quick PDR fixes for small dents and creases without fillers or repaint"\n              },\n              {\n                "@type": "OfferCatalog",\n                "name": "Hail Damage Repair",\n                "description": "Panel-by-panel hail dent restoration that preserves your OEM finish"\n              },\n              {\n                "@type": "OfferCatalog",\n                "name": "Minor Collision Dent Repair",\n                "description": "Correct dents from low-speed impacts when paint is undamaged"\n              }\n            ]\n          },\n          "paymentAccepted": "Cash, Credit Card, Debit Card",\n          "priceRange": "$$",\n          "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-14:00",\n          "image": "https://alldentpdr.com/images/logo-branded.svg",\n          "sameAs": [],\n          "aggregateRating": {\n            "@type": "AggregateRating",\n            "ratingValue": "5",\n            "reviewCount": "47",\n            "bestRating": "5",\n            "worstRating": "1"\n          }\n        }\n      `}\n    <\/script>', "", "", "</head> <body> ", " <main> ", " </main> ", " </body></html>"], ['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', "><title>", '</title><meta name="description"', '><link rel="canonical"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:image"', '><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:image:alt" content="AllDent PDR - Paintless Dent Repair"><meta name="google-site-verification" content="UdUBGJ6CT7WTj7DlCdAeVQ0JqiMupWXbQ9hrj3ZiUwY">', '<meta name="geo.region" content="US-OH"><meta name="geo.placename" content="Cincinnati"><meta name="geo.position" content="39.1031;-84.5120"><meta name="ICBM" content="39.1031, -84.5120">', '<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/images/logo.jpg"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#b0522b"><!-- Google Analytics -->', '<!-- Structured Data for Local SEO --><script type="application/ld+json">\n      {\\`\n        {\n          "@context": "https://schema.org",\n          "@type": "AutoRepair",\n          "name": "AllDent PDR",\n          "description": "Mobile paintless dent repair based in Cincinnati. We travel across the U.S. to repair hail storm damage on-site.",\n          "url": "https://alldentpdr.com",\n          "telephone": "1-855-425-5336",\n          "email": "alldentpdr@gmail.com",\n          "address": {\n            "@type": "PostalAddress",\n            "addressLocality": "Cincinnati",\n            "addressRegion": "OH",\n            "addressCountry": "US"\n          },\n          "areaServed": [\n            {\n              "@type": "City",\n              "name": "Cincinnati"\n            },\n            {\n              "@type": "Country",\n              "name": "United States"\n            }\n          ],\n          "geo": {\n            "@type": "GeoCoordinates",\n            "latitude": 39.1031,\n            "longitude": -84.5120\n          },\n          "hasOfferCatalog": {\n            "@type": "OfferCatalog",\n            "name": "Paintless Dent Repair Services",\n            "itemListElement": [\n              {\n                "@type": "OfferCatalog",\n                "name": "Door Ding Repair",\n                "description": "Quick PDR fixes for small dents and creases without fillers or repaint"\n              },\n              {\n                "@type": "OfferCatalog",\n                "name": "Hail Damage Repair",\n                "description": "Panel-by-panel hail dent restoration that preserves your OEM finish"\n              },\n              {\n                "@type": "OfferCatalog",\n                "name": "Minor Collision Dent Repair",\n                "description": "Correct dents from low-speed impacts when paint is undamaged"\n              }\n            ]\n          },\n          "paymentAccepted": "Cash, Credit Card, Debit Card",\n          "priceRange": "$$",\n          "openingHours": "Mo-Fr 08:00-18:00, Sa 09:00-14:00",\n          "image": "https://alldentpdr.com/images/logo-branded.svg",\n          "sameAs": [],\n          "aggregateRating": {\n            "@type": "AggregateRating",\n            "ratingValue": "5",\n            "reviewCount": "47",\n            "bestRating": "5",\n            "worstRating": "1"\n          }\n        }\n      \\`}\n    <\/script>', "", "", "</head> <body> ", " <main> ", " </main> ", " </body></html>"])), addAttribute(Astro2.generator, "content"), title, addAttribute(description, "content"), addAttribute(canonical, "href"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonical, "content"), addAttribute(`https://alldentpdr.com${ogImage}`, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(`https://alldentpdr.com${ogImage}`, "content"), noindex && renderTemplate`<meta name="robots" content="noindex,nofollow">`, type === "article" && publishedDate && renderTemplate`<meta property="article:published_time"${addAttribute(publishedDate, "content")}>`, renderTemplate`${renderComponent($$result, "Fragment", Fragment$1, {}, { "default": ($$result2) => renderTemplate(_a || (_a = __template(["<script async", "><\/script><script>", "<\/script>"])), addAttribute(`https://www.googletagmanager.com/gtag/js?id=${gaId}`, "src"), unescapeHTML(`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`)) })}`, breadcrumbs.length > 0 && renderTemplate(_b || (_b = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }))), faqItems.length > 0 && renderTemplate(_c || (_c = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }))), renderHead(), !bare && renderTemplate`<header class="site-header"> <div class="container header-inner"> <a class="logo" href="/"> <img src="/images/logo.jpg" alt="AllDent PDR - Paintless Dent Repair Cincinnati" class="logo-img"> <div class="logo-text"> <span class="logo-mark">AllDent PDR</span> <span class="logo-sub">Mobile · Nationwide</span> </div> </a> <nav class="nav"> <a href="/services">Services</a> <a href="/about">About</a> <a href="/blog">Blog</a> <a href="/register">Vehicle Registration</a> <a href="/portal/customer-login">Customer Login</a> <a class="nav-cta" href="/contact">Request Inspection</a> </nav> ${renderComponent($$result, "MobileMenu", MobileMenu, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/components/MobileMenu.jsx", "client:component-export": "default" })} </div> </header>`, renderSlot($$result, $$slots["default"]), !bare && renderTemplate`<footer class="site-footer"> <div class="container footer-inner"> <div> <div class="logo" style="margin-bottom: 14px;"> <img src="/images/logo.jpg" alt="AllDent PDR" class="logo-img"> <div class="logo-text"> <span class="logo-mark" style="color:#fff;">AllDent PDR</span> <span class="logo-sub">Mobile · Nationwide</span> </div> </div> <p>Mobile paintless dent repair based in Cincinnati, OH. We travel nationwide to restore hail damage, door dings, and minor collision dents — preserving your factory finish.</p> </div> <div> <h5>Services</h5> <p><a href="/services">Paintless Dent Repair</a></p> <p><a href="/services">Hail Damage Repair</a></p> <p><a href="/services">Door Ding Removal</a></p> <p><a href="/blog">PDR Blog</a></p> </div> <div> <h5>Contact</h5> <p><a href="tel:18554255336">1-855-425-5336</a></p> <p><a href="mailto:alldentpdr@gmail.com">alldentpdr@gmail.com</a></p> <p><a href="/contact">Request Inspection</a></p> <p><a href="/portal/customer-login">Customer Login</a></p> <p><a href="/portal/admin-dashboard">Admin</a></p> </div> <div> <h5>Hours</h5> <p>Mon – Fri · 8am – 6pm</p> <p>Sat · 9am – 2pm</p> <p>Cincinnati, OH &amp; Nationwide</p> </div> </div> <div class="container footer-bottom"> <span>© 2026 AllDent PDR · Paintless Dent Repair Cincinnati</span> <span><a href="/about">About</a> · <a href="/blog">Blog</a> · <a href="/contact">Contact</a></span> </div> </footer>`);
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
