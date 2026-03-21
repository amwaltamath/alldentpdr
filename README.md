# AllDent PDR Website

Fast, modern marketing site and blog for **AllDent PDR** — a mobile paintless dent repair service based in Cincinnati, serving nationwide.

Built with **Astro 5**, **React**, and **CSS3** for optimal performance and SEO.

## Features

- **SEO Optimized** — Structured data (JSON-LD), meta tags, and keyword targeting for "Paintless Dent Repair" rankings
- **Mobile-First Design** — Responsive layouts with fluid typography and touch-friendly navigation
- **Before/After Gallery** — Interactive image comparison component for showcasing repairs
- **Testimonials** — Customer quotes with star ratings for social proof
- **Trust Signals** — Stats strip and aggregate review schema for credibility
- **Contact Forms** — Formspree integration for estimate requests
- **Blog** — Markdown-based content with automatic routing
- **Process Steps** — Numbered step cards with CSS counters
- **CTA Banners** — High-conversion call-to-action sections throughout
- **Local SEO** — Geo-targeting, business schema, area served metadata
- **Fast Performance** — Static site generation, optimized assets, ~6ms build time

## Tech Stack

- **Astro 5.17** — Static site generation framework
- **React 19** — Interactive components (image comparisons, mobile menu)
- **CSS3** — Custom properties, grid, flexbox, animations
- **Node.js** — Build tools and package management

## Project Structure

```
src/
├── layouts/
│   ├── BaseLayout.astro       # Shared header, footer, SEO metadata
│   └── BlogPost.astro         # Blog post template
├── pages/
│   ├── index.astro            # Homepage
│   ├── services.astro         # Services overview
│   ├── about.astro            # About page
│   ├── contact.astro          # Contact form
│   └── blog/
│       ├── index.astro        # Blog index
│       └── *.md               # Individual blog posts
├── components/
│   ├── BeforeAfter.jsx        # Before/after image toggle
│   └── MobileMenu.jsx         # Mobile navigation
└── styles/
    └── global.css             # Design system & component styles

public/
├── favicon.svg / favicon.ico  # Site icons (branded "AD")
├── site.webmanifest           # PWA manifest
└── images/                    # Before/after repair photos
```

## Local Development

### Setup

```bash
npm install
```

### Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start dev server at `http://localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |

### Making Changes

- **Pages**: Edit `.astro` files in `src/pages/` — routing is automatic
- **Styles**: Update `src/styles/global.css` — uses CSS custom properties
- **Content**: Add markdown files to `src/pages/blog/` for new posts
- **Components**: React components in `src/components/` support interactivity (`client:load`)

## Design System

### Colors

```css
--rust: #b0522b        /* Primary action color */
--sage: #4a7a5c        /* Primary button color */
--sky: #eef5fb         /* Light background */
--card: #fffbf6        /* Card background */
--ink: #1a1410         /* Text color */
```

### Spacing & Shadows

- Grid gaps: `24px`
- Card padding: `28px`
- Shadows: sm/lg variants for depth
- Border radius: `16px` (standard), `24px` (large)

### Transitions

All interactive elements use `0.3s cubic-bezier(0.4, 0, 0.2, 1)` for smooth motion.

## Git Workflow

### Branch Management

- Main development branch: `main`
- Current branch tracking: `main` → `origin/main`
- Old branch: `master` (deprecated, can be removed from GitHub settings)

### Pushing Changes

```bash
git add -A
git commit -m "Clear, descriptive message"
git push                    # Now just 'git push' — upstream is configured
```

### Deployment Flow

1. Push to `main` branch
2. Vercel automatically detects changes
3. Build runs (Astro static generation)
4. Site auto-deploys to production

## Deployment

### Vercel Configuration

- **Production Branch**: `main`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)
- **Node Version**: Latest LTS (auto-managed)

### Environment

No environment variables needed — the site is fully static.

### Manual Deployment

If needed, promote in the Vercel dashboard:
1. Go to `vercel.com/dashboard`
2. Select the project
3. Choose a deployment to promote to Production

## SEO & Schema

### Structured Data Included

- **AutoRepair Schema** — Local business info, services, contact
- **Aggregate Rating** — 5-star average with review count
- **FAQ Schema** — Auto-generated from page FAQ items
- **Breadcrumb Schema** — Navigation hierarchy (where applicable)

### Key Pages for Search

- **Homepage** — Target: "Paintless Dent Repair Cincinnati"
- **Services** — Target: "Hail Damage Repair"
- **Blog** — Target: Long-tail PDR keywords

## Performance

- Build time: ~6 seconds (full site)
- Pages: 10 static routes
- Bundle size: ~190KB (client JS, gzipped)
- Sitemap: Auto-generated by `@astrojs/sitemap`

## Browser Support

Modern browsers (ES2020+):
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contact & Support

For website questions or updates, contact the development team or submit changes via PR.

---

**Last updated**: March 21, 2026
