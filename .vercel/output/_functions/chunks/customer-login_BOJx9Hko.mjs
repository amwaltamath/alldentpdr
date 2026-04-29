import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { l as renderComponent, r as renderTemplate } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { g as getSession, i as isRemotePortalEnabled, j as findCustomerVehicle, d as setSession, c as clearSession } from './storage_R4c_k_sy.mjs';

const STATUS_ORDER = ["Registered", "In Progress", "Complete"];
function statusIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}
function statusPillClass(status) {
  if (status === "Complete") return "status-pill is-complete";
  if (status === "In Progress") return "status-pill is-progress";
  return "status-pill";
}
function CustomerPortal() {
  const [email, setEmail] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setLocalSession] = useState(() => getSession());
  const [vehicle, setVehicle] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!session || session.role !== "customer") {
        if (active) setVehicle(null);
        return;
      }
      setLoading(true);
      try {
        const next = await findCustomerVehicle(session.email || "", session.plate || "");
        if (active) setVehicle(next);
      } catch {
        if (active) setError("Unable to load vehicle status right now. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    if (session && session.role === "customer" && isRemotePortalEnabled()) {
      const id = window.setInterval(load, 3e4);
      return () => {
        active = false;
        window.clearInterval(id);
      };
    }
    return () => {
      active = false;
    };
  }, [session]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const match = await findCustomerVehicle(email, plate);
      if (!match) {
        setError("No vehicle found for that email and plate. Please double-check both fields.");
        return;
      }
      const next = {
        role: "customer",
        vehicleId: match.id,
        email: match.email,
        plate: match.plate,
        loggedInAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setSession(next);
      setLocalSession(next);
      setVehicle(match);
    } catch {
      setError("Unable to verify your vehicle right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    clearSession();
    setLocalSession(null);
    setVehicle(null);
    setEmail("");
    setPlate("");
  };
  if (!vehicle) {
    return /* @__PURE__ */ jsx("section", { className: "portal-shell", children: /* @__PURE__ */ jsx("div", { className: "portal-wrap", children: /* @__PURE__ */ jsxs("div", { className: "portal-card portal-login-card", children: [
      /* @__PURE__ */ jsx("span", { className: "section-label", children: "Customer Portal" }),
      /* @__PURE__ */ jsx("h2", { children: "Track your vehicle" }),
      /* @__PURE__ */ jsx("p", { className: "muted", children: "Enter the email and license plate used at registration to see real-time progress on your repair." }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "cp-email", children: "Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "cp-email",
            type: "email",
            autoComplete: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "you@email.com",
            required: true
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "cp-plate", children: "License plate" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "cp-plate",
            type: "text",
            value: plate,
            onChange: (e) => setPlate(e.target.value),
            placeholder: "ABC1234",
            required: true
          }
        ),
        error && /* @__PURE__ */ jsx("p", { className: "portal-error", children: error }),
        /* @__PURE__ */ jsx("button", { className: "button primary", type: "submit", disabled: loading, style: { width: "100%", marginTop: 4 }, children: loading ? "Checking…" : "View status" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "portal-note", children: isRemotePortalEnabled() ? "Live portal · status refreshes automatically every 30 seconds." : "Demo mode active until the live portal database is connected." })
    ] }) }) });
  }
  const activeStep = statusIndex(vehicle.status);
  return /* @__PURE__ */ jsx("section", { className: "portal-shell", children: /* @__PURE__ */ jsx("div", { className: "portal-wrap", children: /* @__PURE__ */ jsxs("div", { className: "portal-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "portal-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "section-label", children: "Vehicle Status" }),
        /* @__PURE__ */ jsxs("h2", { children: [
          vehicle.year,
          " ",
          vehicle.make,
          " ",
          vehicle.model
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "muted", children: [
          "Job ID ",
          /* @__PURE__ */ jsx("strong", { children: vehicle.id }),
          " · Plate ",
          /* @__PURE__ */ jsx("strong", { children: vehicle.plate })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "button ghost sm", type: "button", onClick: handleLogout, children: "Log out" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "portal-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "portal-status-box", children: [
        /* @__PURE__ */ jsx("p", { className: "portal-kicker", children: "Current status" }),
        /* @__PURE__ */ jsx("span", { className: statusPillClass(vehicle.status), children: vehicle.status }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Updated ",
          new Date(vehicle.updatedAt).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "portal-status-box", children: [
        /* @__PURE__ */ jsx("p", { className: "portal-kicker", children: "On file" }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: vehicle.customerName }) }),
        /* @__PURE__ */ jsx("p", { children: vehicle.email })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "portal-timeline", "aria-label": "Repair progress", children: STATUS_ORDER.map((label, i) => /* @__PURE__ */ jsxs("div", { className: `timeline-step ${i <= activeStep ? "is-active" : ""}`, children: [
      /* @__PURE__ */ jsx("span", { className: "timeline-dot" }),
      /* @__PURE__ */ jsx("span", { children: label })
    ] }, label)) }),
    vehicle.notes && /* @__PURE__ */ jsxs("div", { className: "portal-note-box", children: [
      /* @__PURE__ */ jsx("p", { className: "portal-kicker", children: "Technician notes" }),
      /* @__PURE__ */ jsx("p", { children: vehicle.notes })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "portal-note-box", children: [
      /* @__PURE__ */ jsx("p", { className: "portal-kicker", children: "Notifications" }),
      /* @__PURE__ */ jsx("p", { children: vehicle.notificationsEnabled ? `Status alerts are enabled via ${vehicle.notificationChannel}.` : "Notifications are not enabled for this job yet." })
    ] })
  ] }) }) });
}

const $$CustomerLogin = createComponent(($$result, $$props, $$slots) => {
  const title = "Customer Login | Vehicle Status | AllDent PDR";
  const description = "Customer portal login for AllDent PDR. Track your vehicle from registration through completion in real time.";
  const canonical = "https://alldentpdr.com/portal/customer-login";
  const breadcrumbs = [
    { name: "Home", url: "https://alldentpdr.com" },
    { name: "Customer Login", url: canonical }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "canonical": canonical, "breadcrumbs": breadcrumbs, "noindex": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "CustomerPortal", CustomerPortal, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/components/CustomerPortal.jsx", "client:component-export": "default" })} ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/portal/customer-login.astro", void 0);

const $$file = "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/portal/customer-login.astro";
const $$url = "/portal/customer-login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CustomerLogin,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
