import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { l as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { k as registerVehiclePublic } from './storage_R4c_k_sy.mjs';

const STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
];
const BLANK = {
  customerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "OH",
  zip: "",
  homePhone: "",
  howHeard: "",
  year: "",
  make: "",
  model: "",
  plate: "",
  vin: "",
  color: "",
  insuranceCompany: "",
  deductible: "",
  claimNumber: "",
  notes: "",
  insuranceAuthName: "",
  signatureName: "",
  directionToPaySigned: false,
  repairAuthSigned: false
};
function RegistrationForm() {
  const [form, setForm] = useState(BLANK);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("idle");
  const [jobId, setJobId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
  };
  const canNext1 = form.customerName.trim() && form.email.trim() && form.phone.trim();
  const canNext2 = form.year.trim() && form.make.trim() && form.model.trim() && form.plate.trim();
  const canSubmit = form.directionToPaySigned && form.repairAuthSigned && form.signatureName.trim();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const id = await registerVehiclePublic(form);
      setJobId(id);
      setStatus("success");
      fetch("/api/send-registration-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: id,
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          year: form.year,
          make: form.make,
          model: form.model,
          plate: form.plate
        })
      }).catch((err) => console.warn("[registration email]", err));
    } catch (err) {
      console.error(err);
      setErrorMsg("There was a problem submitting your registration. Please call us at 1-855-425-5336.");
      setStatus("error");
    }
  };
  if (status === "success") {
    return /* @__PURE__ */ jsxs("div", { className: "reg-success", children: [
      /* @__PURE__ */ jsx("div", { className: "reg-success-icon", children: "✓" }),
      /* @__PURE__ */ jsx("h2", { children: "You're registered!" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Your job ID is ",
        /* @__PURE__ */ jsx("strong", { children: jobId }),
        ". We'll be in touch shortly."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "reg-success-sub", children: [
        "Track your repair status anytime at",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/portal/customer-login", children: "alldentpdr.com/portal/customer-login" }),
        " ",
        "using your email and plate number."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "button-row", style: { justifyContent: "center", marginTop: 24 }, children: [
        /* @__PURE__ */ jsx("a", { href: "/", className: "button primary", children: "Back to home" }),
        /* @__PURE__ */ jsx("a", { href: "/portal/customer-login", className: "button ghost", children: "Track my repair" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("form", { className: "reg-form", onSubmit: handleSubmit, noValidate: true, children: [
    /* @__PURE__ */ jsx("div", { className: "reg-steps", children: ["Customer Info", "Vehicle & Insurance", "Authorization"].map((label, i) => /* @__PURE__ */ jsxs("div", { className: `reg-step${step === i + 1 ? " is-active" : step > i + 1 ? " is-done" : ""}`, children: [
      /* @__PURE__ */ jsx("span", { className: "reg-step-num", children: step > i + 1 ? "✓" : i + 1 }),
      /* @__PURE__ */ jsx("span", { className: "reg-step-label", children: label })
    ] }, i)) }),
    step === 1 && /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
      /* @__PURE__ */ jsx("legend", { children: "Customer Information" }),
      /* @__PURE__ */ jsxs("div", { className: "reg-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "r-name", children: [
            "Full name ",
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
          ] }),
          /* @__PURE__ */ jsx("input", { id: "r-name", type: "text", value: form.customerName, onChange: set("customerName"), required: true, placeholder: "Jane Smith" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-date", children: "Date" }),
          /* @__PURE__ */ jsx("input", { id: "r-date", type: "text", value: (/* @__PURE__ */ new Date()).toLocaleDateString(), readOnly: true })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "reg-field full", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "r-address", children: "Street address" }),
        /* @__PURE__ */ jsx("input", { id: "r-address", type: "text", value: form.address, onChange: set("address"), placeholder: "123 Main St" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "reg-row reg-row-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-city", children: "City" }),
          /* @__PURE__ */ jsx("input", { id: "r-city", type: "text", value: form.city, onChange: set("city") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-state", children: "State" }),
          /* @__PURE__ */ jsx("select", { id: "r-state", value: form.state, onChange: set("state"), children: STATES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-zip", children: "ZIP" }),
          /* @__PURE__ */ jsx("input", { id: "r-zip", type: "text", inputMode: "numeric", value: form.zip, onChange: set("zip"), maxLength: 10 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "reg-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "r-cell", children: [
            "Cell phone ",
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
          ] }),
          /* @__PURE__ */ jsx("input", { id: "r-cell", type: "tel", value: form.phone, onChange: set("phone"), required: true, placeholder: "(513) 555-0100" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-home", children: "Home phone" }),
          /* @__PURE__ */ jsx("input", { id: "r-home", type: "tel", value: form.homePhone, onChange: set("homePhone"), placeholder: "(513) 555-0200" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "reg-field full", children: [
        /* @__PURE__ */ jsxs("label", { htmlFor: "r-email", children: [
          "Email address ",
          /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
        ] }),
        /* @__PURE__ */ jsx("input", { id: "r-email", type: "email", value: form.email, onChange: set("email"), required: true, placeholder: "jane@example.com" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "reg-field full", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "r-heard", children: "How did you hear about us?" }),
        /* @__PURE__ */ jsx("input", { id: "r-heard", type: "text", value: form.howHeard, onChange: set("howHeard"), placeholder: "Google, referral, social media…" })
      ] })
    ] }),
    step === 2 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Insurance Information" }),
        /* @__PURE__ */ jsxs("div", { className: "reg-row reg-row-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "r-ins-co", children: "Insurance company" }),
            /* @__PURE__ */ jsx("input", { id: "r-ins-co", type: "text", value: form.insuranceCompany, onChange: set("insuranceCompany") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "r-deduct", children: "Deductible" }),
            /* @__PURE__ */ jsx("input", { id: "r-deduct", type: "text", value: form.deductible, onChange: set("deductible"), placeholder: "$500" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "r-claim", children: "Claim #" }),
            /* @__PURE__ */ jsx("input", { id: "r-claim", type: "text", value: form.claimNumber, onChange: set("claimNumber") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Vehicle Information" }),
        /* @__PURE__ */ jsxs("div", { className: "reg-row reg-row-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "r-year", children: [
              "Year ",
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
            ] }),
            /* @__PURE__ */ jsx("input", { id: "r-year", type: "text", inputMode: "numeric", value: form.year, onChange: set("year"), required: true, placeholder: "2022", maxLength: 4 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "r-make", children: [
              "Make ",
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
            ] }),
            /* @__PURE__ */ jsx("input", { id: "r-make", type: "text", value: form.make, onChange: set("make"), required: true, placeholder: "Toyota" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "r-model", children: [
              "Model ",
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
            ] }),
            /* @__PURE__ */ jsx("input", { id: "r-model", type: "text", value: form.model, onChange: set("model"), required: true, placeholder: "Camry" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-row", children: [
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "r-plate", children: [
              "License plate ",
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
            ] }),
            /* @__PURE__ */ jsx("input", { id: "r-plate", type: "text", value: form.plate, onChange: set("plate"), required: true, placeholder: "ABC1234" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "r-color", children: "Color" }),
            /* @__PURE__ */ jsx("input", { id: "r-color", type: "text", value: form.color, onChange: set("color"), placeholder: "White" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field full", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-vin", children: "VIN #" }),
          /* @__PURE__ */ jsx("input", { id: "r-vin", type: "text", value: form.vin, onChange: set("vin"), placeholder: "1HGCM82633A004352", maxLength: 17 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "reg-field full", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "r-notes", children: "Additional notes" }),
          /* @__PURE__ */ jsx("textarea", { id: "r-notes", rows: 3, value: form.notes, onChange: set("notes"), placeholder: "Describe the damage, number of dents, area of vehicle…" })
        ] })
      ] })
    ] }),
    step === 3 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Direction to Pay" }),
        /* @__PURE__ */ jsxs("p", { className: "reg-legal", children: [
          "I authorize ",
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "reg-inline-input",
              value: form.insuranceAuthName,
              onChange: set("insuranceAuthName"),
              placeholder: "Insurance company name"
            }
          ),
          " Insurance Company to pay All Dent PDR directly for repairs done to my vehicle and ANY rental charges during the time my vehicle is at the shop being repaired."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "reg-legal", children: "I do hereby appoint All Dent PDR to accept on my behalf, any and all checks/drafts and to endorse all such checks/drafts for deposit to All Dent PDR account for payment for repairs to said vehicle, which have been accepted and released. The total amount of repair charges must be paid in full before the vehicle can be released for delivery or picked up. If insurance coverage pays either a portion of or the total amount due, I acknowledge that the insurance check/draft must be obtained by me or sent in advance by the insurance company and received by All Dent PDR. I also acknowledge that I must make arrangements with any lien holder or other payees to endorse the insurance check/draft prior to the release of the above repaired vehicle. I authorize any and all supplements payable directly to All Dent PDR for the consideration of repairs made to the vehicle. If I remove my vehicle from the shop prior to the completion of repairs, I agree to pay for parts, labor, handling fees, service charges, and rental car fees associated with the repair. To secure payment in amount of repairs, an expressed mechanics lien on the vehicle is acknowledged and I further agree to pay reasonable attorney's fees and court costs in the event legal action becomes necessary to enforce this contract. All Dent PDR may repossess my vehicle if payment is not secured." }),
        /* @__PURE__ */ jsx("div", { className: "reg-sign-row", children: /* @__PURE__ */ jsxs("label", { className: "reg-check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.directionToPaySigned, onChange: set("directionToPaySigned"), required: true }),
          "I agree to the Direction to Pay terms above"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Repair Authorization" }),
        /* @__PURE__ */ jsx("p", { className: "reg-legal", children: "I hereby authorize All Dent PDR employees/contractors to operate my vehicle for the purpose of testing, inspection, delivery to and from for repairs. I acknowledge and agree that All Dent PDR will not be held responsible for loss or damage to the vehicle or articles left in the vehicle in case of fire, theft, vehicle accident, or any other cause beyond the control of All Dent PDR. Further, I acknowledge, that if closer analysis reveals additional repairs are necessary, either I or my insurance company will be contacted for authorization of any additional repair charges. If new parts listed in the insurance estimate are not available or replaceable by All Dent PDR, I authorize All Dent PDR to repair such parts when possible. Old parts will be disposed of unless otherwise instructed. I authorize All Dent PDR to manufacture access to dents that may not be accessible due to their location on the vehicle. And as such, All Dent PDR is not responsible for any unrelated prior damage (UPD) noted in the estimate or damage caused by prior work performed on the vehicle." }),
        /* @__PURE__ */ jsx("p", { className: "reg-legal", children: /* @__PURE__ */ jsx("strong", { children: "I authorize All Dent PDR to perform repairs on my vehicle per All Dent PDR estimate." }) }),
        /* @__PURE__ */ jsx("div", { className: "reg-sign-row", children: /* @__PURE__ */ jsxs("label", { className: "reg-check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.repairAuthSigned, onChange: set("repairAuthSigned"), required: true }),
          "I agree to the Repair Authorization terms above"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "reg-fieldset", children: [
        /* @__PURE__ */ jsx("legend", { children: "Signature" }),
        /* @__PURE__ */ jsxs("div", { className: "reg-row", children: [
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "r-sig", children: [
              "Type your full name as signature ",
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "*" })
            ] }),
            /* @__PURE__ */ jsx("input", { id: "r-sig", type: "text", value: form.signatureName, onChange: set("signatureName"), required: true, placeholder: "Jane Smith", className: "reg-sig-input" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reg-field", children: [
            /* @__PURE__ */ jsx("label", { children: "Date" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: (/* @__PURE__ */ new Date()).toLocaleDateString(), readOnly: true })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "reg-legal", style: { marginTop: 8 }, children: "By typing your name above and checking both boxes, you agree this constitutes your legal electronic signature on both the Direction to Pay and Repair Authorization agreements." })
      ] }),
      errorMsg && /* @__PURE__ */ jsx("p", { className: "portal-error", children: errorMsg })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "reg-nav", children: [
      step > 1 && /* @__PURE__ */ jsx("button", { type: "button", className: "button ghost", onClick: () => setStep((s) => s - 1), children: "← Back" }),
      step < 3 && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "button primary",
          disabled: step === 1 ? !canNext1 : !canNext2,
          onClick: () => setStep((s) => s + 1),
          children: "Continue →"
        }
      ),
      step === 3 && /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "button primary",
          disabled: !canSubmit || status === "submitting",
          children: status === "submitting" ? "Submitting…" : "Submit Registration"
        }
      )
    ] })
  ] });
}

const $$Register = createComponent(($$result, $$props, $$slots) => {
  const title = "Vehicle Registration | AllDent PDR";
  const description = "Register your vehicle for paintless dent repair with AllDent PDR. Complete our online intake form to authorize repairs and get started fast.";
  const canonical = "https://alldentpdr.com/register";
  const breadcrumbs = [
    { name: "Home", url: "https://alldentpdr.com" },
    { name: "Register", url: canonical }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "canonical": canonical, "breadcrumbs": breadcrumbs, "data-astro-cid-qraosrxq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="section" style="background: var(--bg); min-height: 80vh;" data-astro-cid-qraosrxq> <div class="container" style="max-width: 780px;" data-astro-cid-qraosrxq> <div style="text-align: center; padding: 48px 0 32px;" data-astro-cid-qraosrxq> <a href="/" style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); text-decoration: none; margin-bottom: 20px;" data-astro-cid-qraosrxq>
← Back to AllDent PDR
</a> <p class="section-label" data-astro-cid-qraosrxq>Intake Form</p> <h1 style="margin-bottom: 8px;" data-astro-cid-qraosrxq>Vehicle Registration</h1> <p style="color: var(--muted); max-width: 520px; margin: 0 auto;" data-astro-cid-qraosrxq>
Complete this form to authorize repairs and get your job on the schedule. Takes about 3 minutes.
</p> <div class="reg-contact-strip" data-astro-cid-qraosrxq> <a href="tel:18554255336" data-astro-cid-qraosrxq>📞 1-855-425-5336</a> <span data-astro-cid-qraosrxq>·</span> <a href="mailto:alldentpdr@gmail.com" data-astro-cid-qraosrxq>✉ alldentpdr@gmail.com</a> </div> </div> <div class="reg-card" data-astro-cid-qraosrxq> ${renderComponent($$result2, "RegistrationForm", RegistrationForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/components/RegistrationForm.jsx", "client:component-export": "default", "data-astro-cid-qraosrxq": true })} </div> </div> </section> ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/register.astro", void 0);

const $$file = "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/register.astro";
const $$url = "/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
