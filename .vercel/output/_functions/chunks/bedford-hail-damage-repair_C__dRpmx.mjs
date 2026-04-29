import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { l as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';

const $$BedfordHailDamageRepair = createComponent(($$result, $$props, $$slots) => {
  const title = "Bedford Hail Damage Repair | Mobile Paintless Dent Repair | AllDent PDR";
  const description = "Hail damage repair in Bedford, OH and surrounding areas. Premium mobile paintless dent repair with factory-finish results. Inspection request from AllDent PDR.";
  const canonical = "https://alldentpdr.com/bedford-hail-damage-repair";
  const breadcrumbs = [
    { name: "Home", url: "https://alldentpdr.com" },
    { name: "Bedford Hail Damage Repair", url: canonical }
  ];
  const faqItems = [
    {
      question: "Do you serve areas around Bedford for hail repair?",
      answer: "Yes. We currently serve Bedford, Bedford Heights, Maple Heights, Garfield Heights, Solon, Warrensville Heights, Oakwood Village, Northfield, Twinsburg, and nearby Northeast Ohio communities."
    },
    {
      question: "How long does hail damage repair take?",
      answer: "Light hail repairs may be finished in one day, while moderate to severe hail damage can take 1 to 3 days depending on dent count and panel access."
    },
    {
      question: "Will hail repair require repainting?",
      answer: "In many cases, no. If paint is intact, we use paintless dent repair to reshape the metal and preserve your factory finish."
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "canonical": canonical, "breadcrumbs": breadcrumbs, "faqItems": faqItems }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="page-hero container"> <span class="section-label">Google Ads Landing Page</span> <h1>Bedford hail damage repair with premium paintless results</h1> <p>If your vehicle was hit in the recent storm, AllDent PDR provides detail-first mobile hail repair in Bedford and surrounding areas.</p> <div class="button-row" style="justify-content: center;"> <a class="button primary" href="/contact">Request an Inspection</a> <a class="button ghost" href="tel:18554255336">Call 1-855-425-5336</a> </div> </section> <section class="section alt"> <div class="container grid-3"> <article class="card"> <h3>Premium quality standard</h3> <p>We focus on finish quality and consistency across every panel, not rushed, volume-only output.</p> </article> <article class="card"> <h3>Factory paint preserved</h3> <p>Our paintless process is designed to keep your OEM finish intact when the paint has not been broken.</p> </article> <article class="card"> <h3>Mobile storm response</h3> <p>We come to Bedford-area customers with the tools and process needed for hail-specific repairs.</p> </article> </div> </section> <section class="section"> <div class="container"> <span class="section-label">Service Area</span> <h2>Serving Bedford and surrounding communities</h2> <p>Current response coverage includes Bedford, Bedford Heights, Maple Heights, Garfield Heights, Solon, Warrensville Heights, Oakwood Village, Northfield, Twinsburg, and Walton Hills.</p> <p>If your city is nearby and impacted by the same weather event, send your location and vehicle details and we will confirm availability quickly.</p> </div> </section> <section class="section alt"> <div class="container"> <span class="section-label">How It Works</span> <h2>Simple 3-step hail repair process</h2> <div class="grid-3"> <article class="card"> <h3>1. Request an inspection</h3> <p>Share your city, vehicle details, and storm information so we can schedule the right evaluation.</p> </article> <article class="card"> <h3>2. Get a clear repair plan</h3> <p>We provide transparent pricing and timeline guidance based on actual damage severity.</p> </article> <article class="card"> <h3>3. Book your repair</h3> <p>We schedule your repair and complete the work with a quality-first process.</p> </article> </div> </div> </section> <section class="cta-banner"> <div class="container"> <h2>Need hail damage repair in Bedford?</h2> <p>Start with an inspection request and get premium-quality paintless dent repair from AllDent PDR.</p> <div class="button-row" style="justify-content: center;"> <a class="button primary" href="/contact">Request Inspection</a> <a class="button ghost" href="/services">View All Services</a> </div> </div> </section> ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/bedford-hail-damage-repair.astro", void 0);

const $$file = "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/bedford-hail-damage-repair.astro";
const $$url = "/bedford-hail-damage-repair";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$BedfordHailDamageRepair,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
