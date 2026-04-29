import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { o as createRenderInstruction, l as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Request Paintless Dent Repair Inspection | Contact AllDent PDR";
  const description = "Request a paintless dent repair inspection from AllDent PDR. Mobile hail damage repair in Cincinnati and nationwide. Same-day replies. Call 1-855-425-5336 or contact us online.";
  const breadcrumbs = [
    { name: "Home", url: "https://alldentpdr.com" },
    { name: "Contact", url: "https://alldentpdr.com/contact" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "canonical": "https://alldentpdr.com/contact", "breadcrumbs": breadcrumbs }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="page-hero container"> <span class="section-label">Contact Us</span> <h1>Request a paintless dent repair inspection</h1> <p>Share a few details about your damage and location — we'll reply the same day with scheduling and availability. We are currently scheduling hail-damage inspections in Bedford, Ohio and surrounding communities.</p> </section> <section class="section alt"> <div class="container contact-panel"> <div class="form-card"> <h3>Inspection request</h3> <p>Fill out the form and we'll email you back within 24 hours.</p> <form id="contact-form"> <label>
Name
<input type="text" name="name" placeholder="Your name" required> </label> <label>
Email
<input type="email" name="email" placeholder="you@email.com" required> </label> <label>
Location
<input type="text" name="location" placeholder="City, State"> </label> <label>
Vehicle
<input type="text" name="vehicle" placeholder="Year, make, model"> </label> <label>
Describe the damage
<textarea name="message" rows="4" placeholder="Location, size, and any details" required></textarea> </label> <button class="button primary" type="submit" id="contact-submit">Send request</button> <p id="contact-status" style="margin-top:12px;display:none"></p> </form> ${renderScript($$result2, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/contact.astro?astro&type=script&index=0&lang.ts")} </div> <div class="card"> <h3>Reach us directly</h3> <p>Phone: 1 855-425-5336</p> <p>Email: alldentpdr@gmail.com</p> <p>Service area: Based in Cincinnati, OH — traveling nationwide for hail storm repairs.</p> <p>Current response area: Bedford, Bedford Heights, Maple Heights, Garfield Heights, Solon, Warrensville Heights, Oakwood Village, Northfield, and nearby communities affected by recent hail.</p> <p>What sets us apart: premium-quality dent removal, careful finishing, and honest recommendations instead of gimmick-first sales tactics.</p> <div class="button-row"> <a class="button ghost" href="/services">Review services</a> </div> </div> </div> </section> ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/contact.astro", void 0);

const $$file = "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
