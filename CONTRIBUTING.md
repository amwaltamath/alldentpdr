# Contributing to AllDent PDR Website

Thanks for helping improve the AllDent PDR website! Here's how to contribute.

## Getting Started

### 1. Clone & Setup
```bash
git clone https://github.com/amwaltamath/alldentpdr.git
cd alldentpdr
npm install
npm run dev
```

Navigate to `http://localhost:4321` to see your changes live.

### 2. Create a Branch (Optional)
For larger features, create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

For the main development flow, you can work directly on `main`.

## Making Changes

### Adding a New Page

1. Create a file in `src/pages/your-page.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const title = 'Page Title | AllDent PDR';
const description = 'Meta description for search engines.';
---

<BaseLayout title={title} description={description}>
  <section class="section">
    <div class="container">
      <h1>Your Content</h1>
    </div>
  </section>
</BaseLayout>
```

2. The page will be available at `/your-page/`

### Adding a Blog Post

1. Create a markdown file in `src/pages/blog/your-post.md`:

```markdown
---
layout: ../../layouts/BlogPost.astro
title: Your Blog Post Title
description: Short description for search engines.
publishedDate: 2026-03-21
---

# Your Blog Post

Content goes here...
```

2. The post will be available at `/blog/your-post/`

### Updating Styles

All styling is in `src/styles/global.css`. Key areas:

- **Color scheme**: `:root` CSS variables at the top
- **Components**: Section starting with class names (`.button`, `.card`, etc.)
- **Media queries**: Mobile styles at the bottom with `@media (max-width: 720px)`

**Remember**: Use CSS custom properties (`var(--rust)`) instead of hardcoded colors.

### Updating Components

React components in `src/components/`:

- `BeforeAfter.jsx` — Image comparison slider
- `MobileMenu.jsx` — Mobile navigation toggle

To use a component in a page, import and render it (use `client:load` for interactivity):

```astro
import MyComponent from '../components/MyComponent.jsx';

<MyComponent client:load />
```

### Updating the Header/Footer

These are in `src/layouts/BaseLayout.astro`. Changes here affect all pages.

**Important**: Keep the SEO metadata (Google Analytics, structured data, meta tags) — they're critical for ranking.

## Code Style

- **Astro files**: Use 2-space indentation, PascalCase for component names
- **React**: Standard React conventions, ES6+ syntax
- **CSS**: Mobile-first, use flexbox/grid, include vendor prefixes where needed
- **Commits**: Clear, descriptive messages (e.g., "Add testimonial section", not "Update stuff")

## Testing Before Submitting

1. **Build locally**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Check for errors**:
   - No console errors in browser DevTools
   - All links work
   - Images load
   - Forms function (Formspree endpoint)

3. **Test mobile**: Open DevTools, toggle device toolbar, test on 375px width

4. **Check SEO tags**: Right-click → View Source, verify `<title>` and `<meta>` tags

## Submitting Changes

### Small Changes (Typos, Style Tweaks)
```bash
git add -A
git commit -m "Fix: typo in services page"
git push                    # Pushes to main & auto-deploys
```

### New Features (Pages, Sections, Components)
```bash
git add -A
git commit -m "Add: testimonial section with star ratings"
git push
```

### First-Time Contributors
Submit a PR or open an issue describing your changes first. The team will review before merging.

## Commit Message Guidelines

Use these formats:

- **Add**: `Add: new testimonials section`
- **Fix**: `Fix: broken contact form link`
- **Update**: `Update: hero section styling`
- **Improve**: `Improve: mobile menu accessibility`
- **Refactor**: `Refactor: CSS color variables`

Example full message:
```
Add: testimonial section with aggregate rating schema

- Added 3 customer testimonial cards
- Included 5-star ratings
- Updated structured data for aggregate reviews
- Added hover lift effects to match card design
```

## Performance Guidelines

- **Images**: Optimize before adding (use ImageOptim, TinyPNG)
- **CSS**: Avoid adding new global styles if component-scoped CSS works
- **JavaScript**: Minimize client JS — most content should be static
- **Build time**: Keep builds under 10 seconds (monitor with `npm run build`)

## SEO Guidelines

- **Titles**: Keep under 60 characters, include primary keyword
- **Descriptions**: 150-160 characters, call-to-action focused
- **Headings**: H1 only once per page, use H2/H3 for hierarchy
- **Links**: Use descriptive anchor text, internal links for navigation
- **Images**: Include alt text with keywords where natural

Example:
```astro
<img 
  src="/image.jpg" 
  alt="Paintless dent repair before and after - hood dent removal Cincinnati"
/>
```

## Getting Help

- Check existing code in `src/pages/` and `src/components/` for examples
- Read the [Astro documentation](https://docs.astro.build/)
- Look at the `.github/copilot-instructions.md` for project conventions
- Reference `README.md` for project structure

## What We're Looking For

- ✅ Clear, readable code
- ✅ Mobile-responsive design
- ✅ Proper SEO (titles, descriptions, schema)
- ✅ Accessibility (alt text, semantic HTML)
- ✅ Performance (optimized assets, minimal JS)
- ✅ Consistency with existing design system

## What to Avoid

- ❌ Hardcoded colors (use CSS variables)
- ❌ Inline styles (use CSS classes)
- ❌ Large unoptimized images
- ❌ Breaking existing functionality
- ❌ Removing SEO metadata
- ❌ Using layout-breaking widths (max-width shouldn't exceed 1140px container)

## Deployment Notes

Once you push to `main`:
1. Vercel automatically detects changes
2. Build runs (~6 seconds)
3. Site auto-deploys to production
4. Changes live within 1-2 minutes

No manual deployment needed for the `main` branch!

---

**Thank you for contributing to AllDent PDR! 🚗**
