# AllDent PDR Website — Development Guide

## Project Setup Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project (Deployed to Vercel, promoted to production)
- [x] Ensure Documentation is Complete

## Project Overview

**AllDent PDR** is a modern, SEO-optimized marketing website for a mobile paintless dent repair service. The site ranks for "Paintless Dent Repair" keywords and serves both customers and dealership partners.

**Tech Stack**: Astro 5 + React 19 + CSS3  
**Hosting**: Vercel (auto-deploy from `main` branch)  
**Domain**: alldentpdr.com

## Recent Updates (March 2026)

### Design & UX Improvements
- **Visual Refresh**: Modern typography (system-ui font stack), fluid sizing with `clamp()`
- **Interactive Elements**: Hover effects, shadows, card lift animations
- **Trust Strip**: Stats showcase (vehicles repaired, cities served, etc.)
- **Process Steps**: Numbered step cards with CSS counters
- **CTA Banners**: High-contrast rust-gradient sections for conversions
- **Testimonials**: Customer quotes with 5-star ratings

### SEO & Content
- **Keyword Targeting**: Title/description rewrite for "Paintless Dent Repair"
- **Structured Data**: AutoRepair + AggregateRating + FAQ + Breadcrumb schemas
- **Footer Enhancement**: Internal service links for better crawlability
- **Meta Tags**: Geo-targeting, ICBM coordinates, comprehensive descriptions

### Branding
- **Logo Favicon**: Branded SVG favicon (rust "AD" on rounded background)
- **Web Manifest**: PWA support with theme color and app metadata

## Development Workflow

### 1. Local Setup
```bash
npm install
npm run dev                    # Start dev server
```

### 2. Making Changes

**Add a page**: Create `.astro` file in `src/pages/`  
**Add a blog post**: Create `.md` file in `src/pages/blog/`  
**Update styles**: Edit `src/styles/global.css`  
**Add component**: React files go in `src/components/` with `client:load` for interactivity

### 3. Testing
```bash
npm run build                  # Full build test
npm run preview               # Preview production build locally
```

### 4. Pushing & Deployment
```bash
git add -A
git commit -m "Description"
git push                      # Auto-deploys to Vercel
```

## Git Conventions

- **Branch**: `main` (production branch)
- **Upstream**: Configured for easy pushes (`git push` alone works)
- **Old branch**: `master` (deprecated, can remove from GitHub)

## Design System

### CSS Custom Properties
```css
--rust: #b0522b           /* Primary action color */
--sage: #4a7a5c           /* Button color */
--sky: #eef5fb            /* Alt section background */
--card: #fffbf6           /* Card background */
--ink: #1a1410            /* Text color */
--transition: 0.3s        /* Animation timing */
```

### Component Patterns
- Cards: 28px padding, 16px border radius, hover lift
- Buttons: Rounded pills, shadow on hover, transform translate
- Sections: Grid layout, 80px padding, alt sections in light blue
- Typography: Serif headings (Georgia), system sans-serif body

## Performance

- **Build**: ~6 seconds (full static generation)
- **Output**: `dist/` folder (~190KB gzipped JS)
- **Deployment**: Instant on Vercel
- **Sitemap**: Auto-generated to `dist/sitemap-index.xml`

## Common Tasks

### Add a Testimonial
Edit `src/pages/index.astro` → Find `.testimonial-grid` → Add new `blockquote.testimonial-card`

### Update Service List
Edit service cards in `src/pages/services.astro` or `src/pages/index.astro`

### Add FAQ Items
Pass `faqItems` array to `BaseLayout` component in any page frontmatter

### Change Colors
Update CSS variables in `src/styles/global.css` `:root{}`

### Deploy Hotfix
Push to `main` → Auto-builds → Manually promote in Vercel if needed

## Troubleshooting

**Build fails**: Check for Astro syntax errors, ensure all imports exist  
**Styles not loading**: Browser cache — hard refresh (Ctrl+Shift+R)  
**Images missing**: Verify paths in `public/images/` directory  
**Deploy not showing**: Check Vercel dashboard, verify `main` is set as production branch

## Resources

- [Astro Docs](https://docs.astro.build/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [SEO Best Practices](https://schema.org)
- [CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

**Last Updated**: March 21, 2026  
**Maintained by**: AllDent PDR Development Team
