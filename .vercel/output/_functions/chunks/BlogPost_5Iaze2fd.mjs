import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { l as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as renderSlot } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';

const $$BlogPost = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BlogPost;
  const { title, description, pubDate } = Astro2.props;
  const fullTitle = `${title} | AllDent PDR`;
  const canonical = `https://alldentpdr.com`;
  const breadcrumbs = [
    { name: "Home", url: "https://alldentpdr.com" },
    { name: "Blog", url: "https://alldentpdr.com/blog" },
    { name: title, url: canonical }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": fullTitle, "description": description, "canonical": canonical, "type": "article", "publishedDate": pubDate, "breadcrumbs": breadcrumbs }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="section"> <div class="container"> <article class="article-shell" itemscope itemtype="https://schema.org/BlogPosting"> <meta itemprop="headline"${addAttribute(title, "content")}> <meta itemprop="description"${addAttribute(description, "content")}> <meta itemprop="datePublished"${addAttribute(pubDate, "content")}> <meta itemprop="author" content="AllDent PDR"> <nav class="breadcrumb" aria-label="Breadcrumb"> <ol> <li><a href="/">Home</a></li> <li><a href="/blog">Blog</a></li> <li aria-current="page">${title}</li> </ol> </nav> <p class="tag">${pubDate}</p> <h1>${title}</h1> <p class="muted" style="font-size:1.1rem;">${description}</p> ${renderSlot($$result2, $$slots["default"])} <div class="button-row" style="margin-top: 2rem;"> <a class="button primary" href="/contact">Request an Inspection</a> <a class="button ghost" href="/services">View All Services</a> </div> </article> </div> </section> ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/layouts/BlogPost.astro", void 0);

export { $$BlogPost as $ };
