import { c as createComponent } from './astro-component_BTanpJro.mjs';
import 'piccolore';
import { l as renderComponent, r as renderTemplate } from './entrypoint_Dt5qyCpC.mjs';
import { $ as $$BaseLayout } from './BaseLayout_BjTZv2mP.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useMemo, useRef } from 'react';
import { g as getSession, i as isRemotePortalEnabled, a as getRemoteAuthUser, b as isRemoteAdmin, s as signOutRemoteAdmin, c as clearSession, d as setSession, e as getVehicles, f as signInRemoteAdmin, r as registerVehicle, u as updateVehicleStatus, h as updateVehicle } from './storage_R4c_k_sy.mjs';

const ADMIN_USER = "zachary@alldentpdr.com";
const ADMIN_PASS = "AlldentPDR2026";
const STATUS_OPTIONS = ["Registered", "In Progress", "Complete"];
const initialForm = {
  // Customer Information
  customerName: "",
  email: "",
  phone: "",
  homePhone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  howHeardAboutUs: "",
  // Insurance / Vehicle Information
  insuranceCompany: "",
  deductible: "",
  claimNumber: "",
  year: "",
  make: "",
  model: "",
  vin: "",
  color: "",
  plate: "",
  // Job Settings
  status: "Registered",
  notes: "",
  notificationsEnabled: true,
  notificationChannel: "email"
};
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "◧" },
  { id: "pipeline", label: "Pipeline", icon: "▦" },
  { id: "jobs", label: "All Jobs", icon: "☰" },
  { id: "quote", label: "New Quote", icon: "$" },
  { id: "register", label: "Register Vehicle", icon: "+" },
  { id: "cards", label: "Business Cards", icon: "▣" }
];
function statusBadge(status) {
  if (status === "Complete") return "badge complete";
  if (status === "In Progress") return "badge progress";
  return "badge registered";
}
function initials(email = "") {
  if (!email) return "A";
  const name = email.split("@")[0] || "A";
  return name.slice(0, 2).toUpperCase();
}
function AdminDashboard() {
  const [session, setLocalSession] = useState(() => getSession());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [view, setView] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [pipelineMode, setPipelineMode] = useState("kanban");
  const [form, setForm] = useState(initialForm);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const remoteMode = isRemotePortalEnabled();
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!remoteMode) return;
      const user = await getRemoteAuthUser();
      if (!active || !user) return;
      const allowed = await isRemoteAdmin();
      if (!allowed) {
        await signOutRemoteAdmin();
        if (active) {
          clearSession();
          setLocalSession(null);
          setAuthError("Your account is authenticated but not approved for admin access.");
        }
        return;
      }
      const next = { role: "admin", email: user.email, loggedInAt: (/* @__PURE__ */ new Date()).toISOString() };
      setSession(next);
      setLocalSession(next);
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, [remoteMode]);
  useEffect(() => {
    let active = true;
    async function load() {
      if (remoteMode && (!session || session.role !== "admin")) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const next = await getVehicles();
        if (active) setVehicles(next);
      } catch {
        if (active) setAuthError("Unable to load vehicle data.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [remoteMode, session]);
  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) => v.customerName.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }, [search, vehicles]);
  const metrics = useMemo(() => {
    const total = vehicles.length;
    const registered = vehicles.filter((v) => v.status === "Registered").length;
    const inProgress = vehicles.filter((v) => v.status === "In Progress").length;
    const complete = vehicles.filter((v) => v.status === "Complete").length;
    const completionRate = total ? Math.round(complete / total * 100) : 0;
    return { total, registered, inProgress, complete, completionRate };
  }, [vehicles]);
  const grouped = useMemo(() => {
    const list = filteredVehicles;
    return {
      Registered: list.filter((v) => v.status === "Registered"),
      "In Progress": list.filter((v) => v.status === "In Progress"),
      Complete: list.filter((v) => v.status === "Complete")
    };
  }, [filteredVehicles]);
  const recent = useMemo(() => filteredVehicles.slice(0, 5), [filteredVehicles]);
  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    if (remoteMode) {
      try {
        const data = await signInRemoteAdmin(username, password);
        if (!data?.user) {
          setAuthError("Invalid admin credentials.");
          return;
        }
        const allowed = await isRemoteAdmin();
        if (!allowed) {
          await signOutRemoteAdmin();
          setAuthError("This account is not on the approved admin allowlist.");
          return;
        }
        const next2 = { role: "admin", email: data.user.email, loggedInAt: (/* @__PURE__ */ new Date()).toISOString() };
        setSession(next2);
        setLocalSession(next2);
        setUsername("");
        setPassword("");
      } catch {
        setAuthError("Login failed. Please verify your Supabase admin credentials.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      setAuthError("Invalid admin credentials.");
      setAuthLoading(false);
      return;
    }
    const next = { role: "admin", loggedInAt: (/* @__PURE__ */ new Date()).toISOString() };
    setSession(next);
    setLocalSession(next);
    setUsername("");
    setPassword("");
    setAuthLoading(false);
  };
  const handleRegister = async (event) => {
    event.preventDefault();
    setSaveMessage("");
    try {
      await registerVehicle(form);
      setVehicles(await getVehicles());
      setForm(initialForm);
      setSaveMessage("Vehicle registered successfully.");
      setView("jobs");
    } catch {
      setSaveMessage("Unable to save the vehicle right now.");
    }
  };
  const handleStatusChange = async (id, nextStatus) => {
    await updateVehicleStatus(id, nextStatus);
    const updated = await getVehicles();
    setVehicles(updated);
    const vehicle = updated.find((v) => v.id === id);
    if (vehicle?.notificationsEnabled && vehicle?.email) {
      fetch("/api/send-status-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: vehicle.id,
          customerName: vehicle.customerName,
          email: vehicle.email,
          status: nextStatus,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          plate: vehicle.plate
        })
      }).catch((err) => console.warn("[status email]", err));
    }
  };
  const handleNotificationChange = async (id, field, value) => {
    await updateVehicle(id, { [field]: value });
    setVehicles(await getVehicles());
  };
  const handleLogout = () => {
    if (remoteMode) signOutRemoteAdmin();
    clearSession();
    setLocalSession(null);
  };
  if (!session || session.role !== "admin") {
    return /* @__PURE__ */ jsx("section", { className: "portal-shell", children: /* @__PURE__ */ jsx("div", { className: "portal-wrap", children: /* @__PURE__ */ jsxs("div", { className: "portal-card portal-login-card", children: [
      /* @__PURE__ */ jsx("span", { className: "section-label", children: "Admin Sign-in" }),
      /* @__PURE__ */ jsx("h2", { children: "Welcome back" }),
      /* @__PURE__ */ jsx("p", { className: "muted", children: remoteMode ? "Sign in with your Supabase admin email." : "Demo mode — local credentials accepted until Supabase variables are set." }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAdminLogin, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "ad-user", children: remoteMode ? "Admin email" : "Username" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "ad-user",
            type: remoteMode ? "email" : "text",
            autoComplete: "username",
            value: username,
            onChange: (e) => setUsername(e.target.value),
            placeholder: remoteMode ? "admin@alldentpdr.com" : "admin",
            required: true
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "ad-pass", children: "Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "ad-pass",
            type: "password",
            autoComplete: "current-password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true
          }
        ),
        authError && /* @__PURE__ */ jsx("p", { className: "portal-error", children: authError }),
        /* @__PURE__ */ jsx("button", { className: "button primary", type: "submit", disabled: authLoading, style: { width: "100%", marginTop: 4 }, children: authLoading ? "Signing in…" : "Sign in" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "portal-note", children: /* @__PURE__ */ jsx("a", { href: "/", children: "← Back to alldentpdr.com" }) })
    ] }) }) });
  }
  const userInitials = initials(session.email);
  const userLabel = session.email || "Admin";
  return /* @__PURE__ */ jsxs("div", { className: "dash", children: [
    navOpen && /* @__PURE__ */ jsx("div", { className: "dash-overlay", onClick: () => setNavOpen(false), "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("aside", { className: `dash-aside${navOpen ? " is-open" : ""}`, children: [
      /* @__PURE__ */ jsxs("a", { href: "/", className: "dash-brand", title: "Back to site", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.jpg", alt: "" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "AllDent" }),
          /* @__PURE__ */ jsx("span", { children: "Admin" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-nav-label", children: "Workspace" }),
      /* @__PURE__ */ jsx("nav", { className: "dash-nav", children: NAV_ITEMS.map((item) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: view === item.id ? "is-active" : "",
          onClick: () => {
            setView(item.id);
            setNavOpen(false);
          },
          children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", style: { width: 16, opacity: 0.7 }, children: item.icon }),
            item.label
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "dash-nav-label", children: "Account" }),
      /* @__PURE__ */ jsxs("nav", { className: "dash-nav", children: [
        /* @__PURE__ */ jsx("a", { href: "/", target: "_blank", rel: "noreferrer", onClick: () => setNavOpen(false), children: "↗ View public site" }),
        /* @__PURE__ */ jsx("a", { href: "/register", target: "_blank", rel: "noreferrer", onClick: () => setNavOpen(false), children: "📋 Vehicle registration" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          handleLogout();
          setNavOpen(false);
        }, children: "↩ Sign out" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-aside-bottom", children: [
        /* @__PURE__ */ jsx("p", { children: remoteMode ? "Live · Supabase connected" : "Demo · local-only data" }),
        /* @__PURE__ */ jsxs("div", { className: "dash-aside-user", children: [
          /* @__PURE__ */ jsx("span", { className: "dash-avatar", style: { width: 28, height: 28, fontSize: 11 }, children: userInitials }),
          /* @__PURE__ */ jsx("span", { className: "dash-aside-user-label", children: userLabel })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-main", children: [
      /* @__PURE__ */ jsxs("header", { className: "dash-topbar", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "dash-hamburger",
            "aria-label": "Open navigation",
            "aria-expanded": navOpen,
            onClick: () => setNavOpen(true),
            children: [
              /* @__PURE__ */ jsx("span", {}),
              /* @__PURE__ */ jsx("span", {}),
              /* @__PURE__ */ jsx("span", {})
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "crumb", children: "Admin" }),
          /* @__PURE__ */ jsx("h1", { children: NAV_ITEMS.find((n) => n.id === view)?.label || "Dashboard" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "dash-search", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Search by customer, plate, or job ID…"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "dash-user", children: [
          /* @__PURE__ */ jsx("span", { className: "dash-avatar", children: userInitials }),
          /* @__PURE__ */ jsx("span", { children: userLabel })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("main", { className: "dash-content", children: [
        view === "overview" && /* @__PURE__ */ jsx(
          OverviewView,
          {
            metrics,
            recent,
            loading,
            onJump: setView,
            remoteMode
          }
        ),
        view === "pipeline" && /* @__PURE__ */ jsx(
          PipelineView,
          {
            grouped,
            mode: pipelineMode,
            setMode: setPipelineMode,
            onStatusChange: handleStatusChange,
            loading
          }
        ),
        view === "jobs" && /* @__PURE__ */ jsx(
          JobsView,
          {
            vehicles: filteredVehicles,
            loading,
            onStatusChange: handleStatusChange,
            onNotificationChange: handleNotificationChange
          }
        ),
        view === "register" && /* @__PURE__ */ jsx(
          RegisterView,
          {
            form,
            setForm,
            onSubmit: handleRegister,
            saveMessage
          }
        ),
        view === "quote" && /* @__PURE__ */ jsx(QuoteView, { vehicles }),
        view === "cards" && /* @__PURE__ */ jsx(CardsView, {})
      ] })
    ] })
  ] });
}
function OverviewView({ metrics, recent, loading, onJump, remoteMode }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "kpi-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "kpi", children: [
        /* @__PURE__ */ jsx("span", { className: "kpi-label", children: "Total jobs" }),
        /* @__PURE__ */ jsx("span", { className: "kpi-value", children: metrics.total }),
        /* @__PURE__ */ jsx("div", { className: "kpi-sub", children: remoteMode ? "Live across all admins" : "Local-only data" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "kpi kpi-accent", children: [
        /* @__PURE__ */ jsx("span", { className: "kpi-label", children: "Registered" }),
        /* @__PURE__ */ jsx("span", { className: "kpi-value", children: metrics.registered }),
        /* @__PURE__ */ jsx("div", { className: "kpi-sub", children: "Awaiting work" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "kpi kpi-warn", children: [
        /* @__PURE__ */ jsx("span", { className: "kpi-label", children: "In progress" }),
        /* @__PURE__ */ jsx("span", { className: "kpi-value", children: metrics.inProgress }),
        /* @__PURE__ */ jsx("div", { className: "kpi-sub", children: "Active right now" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "kpi kpi-ok", children: [
        /* @__PURE__ */ jsx("span", { className: "kpi-label", children: "Completed" }),
        /* @__PURE__ */ jsx("span", { className: "kpi-value", children: metrics.complete }),
        /* @__PURE__ */ jsxs("div", { className: "kpi-sub", children: [
          metrics.completionRate,
          "% completion rate"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dash-grid-2", children: /* @__PURE__ */ jsxs("section", { className: "panel", children: [
      /* @__PURE__ */ jsxs("div", { className: "panel-head", children: [
        /* @__PURE__ */ jsx("h3", { children: "Recent jobs" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "button ghost sm", onClick: () => onJump("jobs"), children: "View all →" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Job" }),
          /* @__PURE__ */ jsx("th", { children: "Vehicle" }),
          /* @__PURE__ */ jsx("th", { children: "Customer" }),
          /* @__PURE__ */ jsx("th", { children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          recent.map((v) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.id }),
              /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.plate })
            ] }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "cell-strong", children: [
              v.year,
              " ",
              v.make,
              " ",
              v.model
            ] }) }),
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.customerName }),
              /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.email })
            ] }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: statusBadge(v.status), children: v.status }) })
          ] }, v.id)),
          !loading && !recent.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "kanban-empty", children: "No jobs yet. Register your first vehicle to get started." }) }),
          loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "kanban-empty", children: "Loading…" }) })
        ] })
      ] }) })
    ] }) })
  ] });
}
function PipelineView({ grouped, mode, setMode, onStatusChange, loading }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "panel-head", style: { marginBottom: 18, borderRadius: 12, background: "transparent", borderBottom: "none", padding: 0 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { style: { marginBottom: 4 }, children: "Repair pipeline" }),
        /* @__PURE__ */ jsx("p", { className: "meta", style: { margin: 0 }, children: "Move jobs through Registered → In Progress → Complete" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "tabs", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: mode === "kanban" ? "is-active" : "", onClick: () => setMode("kanban"), children: "Kanban" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: mode === "list" ? "is-active" : "", onClick: () => setMode("list"), children: "List" })
      ] })
    ] }),
    mode === "kanban" ? /* @__PURE__ */ jsx("div", { className: "kanban", children: STATUS_COLUMNS.map((col) => /* @__PURE__ */ jsxs("section", { className: "kanban-col", "data-col": col, children: [
      /* @__PURE__ */ jsxs("div", { className: "kanban-col-head", children: [
        /* @__PURE__ */ jsx("strong", { children: col }),
        /* @__PURE__ */ jsx("span", { className: "count", children: grouped[col].length })
      ] }),
      grouped[col].length === 0 && /* @__PURE__ */ jsx("div", { className: "kanban-empty", children: "No jobs here." }),
      grouped[col].map((v) => /* @__PURE__ */ jsxs("article", { className: "kanban-card", children: [
        /* @__PURE__ */ jsx("div", { className: "kc-id", children: v.id }),
        /* @__PURE__ */ jsxs("div", { className: "kc-title", children: [
          v.year,
          " ",
          v.make,
          " ",
          v.model
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "kc-meta", children: [
          v.customerName,
          " · ",
          v.plate
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "kc-foot", children: [
          /* @__PURE__ */ jsx("span", { className: statusBadge(v.status), children: v.status }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: v.status,
              onChange: (e) => onStatusChange(v.id, e.target.value),
              "aria-label": `Change status for ${v.id}`,
              children: STATUS_COLUMNS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
            }
          )
        ] })
      ] }, v.id))
    ] }, col)) }) : /* @__PURE__ */ jsx("section", { className: "panel", children: /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Job" }),
        /* @__PURE__ */ jsx("th", { children: "Vehicle" }),
        /* @__PURE__ */ jsx("th", { children: "Customer" }),
        /* @__PURE__ */ jsx("th", { children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        STATUS_COLUMNS.flatMap((col) => grouped[col]).map((v) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { children: [
            /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.id }),
            /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.plate })
          ] }),
          /* @__PURE__ */ jsxs("td", { children: [
            v.year,
            " ",
            v.make,
            " ",
            v.model
          ] }),
          /* @__PURE__ */ jsxs("td", { children: [
            /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.customerName }),
            /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.email })
          ] }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("select", { value: v.status, onChange: (e) => onStatusChange(v.id, e.target.value), children: STATUS_COLUMNS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) }) })
        ] }, v.id)),
        loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "kanban-empty", children: "Loading…" }) })
      ] })
    ] }) }) })
  ] });
}
const STATUS_COLUMNS = ["Registered", "In Progress", "Complete"];
function JobDetail({ v, onClose, onStatusChange, onNotificationChange }) {
  return /* @__PURE__ */ jsx("div", { className: "job-drawer-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("aside", { className: "job-drawer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "job-drawer-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "crumb", style: { margin: 0 }, children: v.id }),
        /* @__PURE__ */ jsxs("h3", { style: { margin: "2px 0 0" }, children: [
          v.year,
          " ",
          v.make,
          " ",
          v.model
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "job-drawer-close", onClick: onClose, "aria-label": "Close", children: "✕" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "job-drawer-body", children: [
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", children: "Status" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx("span", { className: statusBadge(v.status), children: v.status }),
        /* @__PURE__ */ jsx("select", { value: v.status, onChange: (e) => onStatusChange(v.id, e.target.value), children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 22 }, children: "Customer" }),
      /* @__PURE__ */ jsxs("div", { className: "job-drawer-grid", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Name" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.customerName || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Email" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.email || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Cell phone" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.phone || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Home phone" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.homePhone || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Address" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: [v.address, v.city, v.state, v.zip].filter(Boolean).join(", ") || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "How heard" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.howHeardAboutUs || "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 22 }, children: "Vehicle" }),
      /* @__PURE__ */ jsxs("div", { className: "job-drawer-grid", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Year / Make / Model" }),
          /* @__PURE__ */ jsxs("span", { className: "jd-val", children: [
            v.year,
            " ",
            v.make,
            " ",
            v.model
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Color" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.color || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Plate" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.plate || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "VIN" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", style: { fontFamily: "monospace", fontSize: 13 }, children: v.vin || "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 22 }, children: "Insurance" }),
      /* @__PURE__ */ jsxs("div", { className: "job-drawer-grid", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Company" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.insuranceCompany || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Deductible" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.deductible || "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "jd-label", children: "Claim #" }),
          /* @__PURE__ */ jsx("span", { className: "jd-val", children: v.claimNumber || "—" })
        ] })
      ] }),
      v.notes && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 22 }, children: "Notes" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 14, lineHeight: 1.6, margin: 0 }, children: v.notes })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 22 }, children: "Notifications" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxs("label", { className: "checkbox-row", style: { margin: 0 }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: Boolean(v.notificationsEnabled),
              onChange: (e) => onNotificationChange(v.id, "notificationsEnabled", e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13 }, children: "Alerts enabled" })
        ] }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: v.notificationChannel || "email",
            onChange: (e) => onNotificationChange(v.id, "notificationChannel", e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "email", children: "Email" }),
              /* @__PURE__ */ jsx("option", { value: "web-push", children: "Web Push" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "cell-sub", style: { marginTop: 20 }, children: [
        "Registered ",
        new Date(v.createdAt).toLocaleDateString(),
        " · Updated ",
        new Date(v.updatedAt).toLocaleDateString()
      ] })
    ] })
  ] }) });
}
function JobsView({ vehicles, loading, onStatusChange, onNotificationChange }) {
  const [selected, setSelected] = useState(null);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    selected && /* @__PURE__ */ jsx(
      JobDetail,
      {
        v: selected,
        onClose: () => setSelected(null),
        onStatusChange: (id, s) => {
          onStatusChange(id, s);
          setSelected((prev) => prev ? { ...prev, status: s } : null);
        },
        onNotificationChange: (id, field, val) => {
          onNotificationChange(id, field, val);
          setSelected((prev) => prev ? { ...prev, [field]: val } : null);
        }
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "panel", children: [
      /* @__PURE__ */ jsx("div", { className: "panel-head", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "All jobs" }),
        /* @__PURE__ */ jsxs("p", { className: "meta", style: { margin: "2px 0 0" }, children: [
          vehicles.length,
          " ",
          vehicles.length === 1 ? "job" : "jobs"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Job" }),
          /* @__PURE__ */ jsx("th", { children: "Vehicle" }),
          /* @__PURE__ */ jsx("th", { children: "Customer" }),
          /* @__PURE__ */ jsx("th", { children: "Status" }),
          /* @__PURE__ */ jsx("th", { children: "Notifications" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          vehicles.map((v) => /* @__PURE__ */ jsxs("tr", { className: "job-row-clickable", onClick: () => setSelected(v), children: [
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.id }),
              /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.plate })
            ] }),
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsxs("div", { className: "cell-strong", children: [
                v.year,
                " ",
                v.make,
                " ",
                v.model
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "cell-sub", children: [
                "Updated ",
                new Date(v.updatedAt).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { children: [
              /* @__PURE__ */ jsx("div", { className: "cell-strong", children: v.customerName }),
              /* @__PURE__ */ jsx("div", { className: "cell-sub", children: v.email })
            ] }),
            /* @__PURE__ */ jsx("td", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx("select", { value: v.status, onChange: (e) => onStatusChange(v.id, e.target.value), children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) }) }),
            /* @__PURE__ */ jsx("td", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "row-actions", children: [
              /* @__PURE__ */ jsxs("label", { className: "checkbox-row", style: { margin: 0 }, children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: Boolean(v.notificationsEnabled),
                    onChange: (e) => onNotificationChange(v.id, "notificationsEnabled", e.target.checked)
                  }
                ),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 13 }, children: "Alerts" })
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: v.notificationChannel || "email",
                  onChange: (e) => onNotificationChange(v.id, "notificationChannel", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "email", children: "Email" }),
                    /* @__PURE__ */ jsx("option", { value: "web-push", children: "Web Push" })
                  ]
                }
              )
            ] }) })
          ] }, v.id)),
          !loading && !vehicles.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "kanban-empty", children: "No jobs match your search yet." }) }),
          loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "kanban-empty", children: "Loading…" }) })
        ] })
      ] }) })
    ] })
  ] });
}
const TEAM_CARDS = [
  { slug: "zachary", name: "Zachary", title: "PDR Specialist", email: "zachary@alldentpdr.com" },
  { slug: "kevin", name: "Kevin", title: "PDR Specialist", email: "kevin@alldentpdr.com" },
  { slug: "patrick", name: "Patrick", title: "PDR Specialist", email: "patrick@alldentpdr.com" }
];
function CardsView() {
  const base = "https://alldentpdr.com";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "panel-head", style: { marginBottom: 18, background: "transparent", border: "none", padding: 0 }, children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { style: { marginBottom: 4 }, children: "Digital Business Cards" }),
      /* @__PURE__ */ jsx("p", { className: "meta", style: { margin: 0 }, children: "Share your card link or let customers scan the QR code." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "cards-grid", children: TEAM_CARDS.map((c) => {
      const url = `${base}/card/${c.slug}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=b0522b&bgcolor=ffffff&margin=8`;
      return /* @__PURE__ */ jsxs("div", { className: "biz-preview-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "bpc-header", children: [
          /* @__PURE__ */ jsx("img", { src: "/images/logo.jpg", alt: "" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: c.name }),
            /* @__PURE__ */ jsx("span", { children: c.title })
          ] })
        ] }),
        /* @__PURE__ */ jsx("img", { src: qr, alt: `QR for ${c.name}`, className: "bpc-qr", width: "80", height: "80" }),
        /* @__PURE__ */ jsx("p", { className: "bpc-url", children: url.replace("https://", "") }),
        /* @__PURE__ */ jsxs("div", { className: "bpc-actions", children: [
          /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noreferrer", className: "button ghost sm", children: "Preview ↗" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "button primary sm",
              onClick: () => navigator.clipboard.writeText(url),
              children: "Copy link"
            }
          )
        ] })
      ] }, c.slug);
    }) })
  ] });
}
function VinScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [scanError, setScanError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BarcodeDetector" in window)) {
      setScanError(
        "Barcode scanning is not supported in this browser. Please use Chrome or Edge on Android, or enter the VIN manually."
      );
      return;
    }
    let stream = null;
    let frameId = null;
    let active = true;
    const detector = new window.BarcodeDetector({
      formats: ["qr_code", "code_39", "code_93", "code_128", "pdf417", "data_matrix"]
    });
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          scan();
        }
      } catch {
        setScanError("Camera access denied. Please allow camera access, or enter the VIN manually.");
      }
    }
    async function scan() {
      if (!active || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        for (const r of results) {
          const vin = r.rawValue.replace(/\*/g, "").trim().toUpperCase();
          if (vin.length >= 5) {
            active = false;
            onScan(vin);
            return;
          }
        }
      } catch {
      }
      frameId = requestAnimationFrame(scan);
    }
    startCamera();
    return () => {
      active = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "vin-scanner-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "vin-scanner-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "vin-scanner-head", children: [
      /* @__PURE__ */ jsx("h3", { children: "Scan VIN" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "job-drawer-close", onClick: onClose, "aria-label": "Close", children: "✕" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "vin-scanner-hint", children: "Point the camera at the VIN barcode on the door jamb sticker or QR code." }),
    scanError ? /* @__PURE__ */ jsx("p", { style: { color: "var(--rust,#b0522b)", textAlign: "center", padding: "24px 0", fontSize: 14 }, children: scanError }) : /* @__PURE__ */ jsxs("div", { style: { position: "relative", borderRadius: 8, overflow: "hidden", background: "#111", minHeight: 180 }, children: [
      /* @__PURE__ */ jsx(
        "video",
        {
          ref: videoRef,
          style: { width: "100%", display: "block" },
          muted: true,
          playsInline: true
        }
      ),
      ready && /* @__PURE__ */ jsx("div", { className: "vin-scan-reticle" }),
      !ready && /* @__PURE__ */ jsx("p", { style: { color: "#aaa", textAlign: "center", padding: "48px 16px", fontSize: 13, margin: 0 }, children: "Starting camera…" })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { textAlign: "center", marginTop: 16 }, children: /* @__PURE__ */ jsx("button", { type: "button", className: "button ghost sm", onClick: onClose, children: "Cancel" }) })
  ] }) });
}
const PDR_PANELS = [
  // Front
  { id: "hood", label: "Hood", section: "Front" },
  { id: "lf_fender", label: "LF Fender", section: "Front" },
  { id: "rf_fender", label: "RF Fender", section: "Front" },
  { id: "front_bumper", label: "Front Bumper Cover", section: "Front" },
  // Left Side
  { id: "lf_door", label: "LF Door", section: "Left Side" },
  { id: "lr_door", label: "LR Door", section: "Left Side" },
  { id: "lr_quarter", label: "LR Quarter Panel", section: "Left Side" },
  { id: "lf_rocker", label: "LF Rocker Panel", section: "Left Side" },
  // Right Side
  { id: "rf_door", label: "RF Door", section: "Right Side" },
  { id: "rr_door", label: "RR Door", section: "Right Side" },
  { id: "rr_quarter", label: "RR Quarter Panel", section: "Right Side" },
  { id: "rf_rocker", label: "RF Rocker Panel", section: "Right Side" },
  // Top
  { id: "roof", label: "Roof", section: "Top" },
  // Rear
  { id: "trunk", label: "Trunk / Liftgate", section: "Rear" },
  { id: "rear_bumper", label: "Rear Bumper Cover", section: "Rear" },
  // Other
  { id: "lf_mirror", label: "LF Mirror Cap", section: "Other" },
  { id: "rf_mirror", label: "RF Mirror Cap", section: "Other" }
];
const PANEL_SECTIONS = ["Front", "Left Side", "Right Side", "Top", "Rear", "Other"];
const PANEL_METHODS = ["PDR", "R&I", "R&R"];
const PANEL_SIZES = ["Small", "Medium", "Large", "Oversized"];
function buildBlankPanels() {
  const panels = {};
  PDR_PANELS.forEach((p) => {
    panels[p.id] = { checked: false, method: "PDR", dents: "", size: "Small", price: "" };
  });
  return panels;
}
const BLANK_QUOTE = {
  vin: "",
  year: "",
  make: "",
  model: "",
  color: "",
  plate: "",
  customerName: "",
  insuranceCompany: "",
  claimNumber: "",
  panels: buildBlankPanels(),
  notes: ""
};
function QuoteView({ vehicles }) {
  const [quote, setQuote] = useState(BLANK_QUOTE);
  const [scanning, setScanning] = useState(false);
  const setField = (key) => (e) => setQuote((q) => ({ ...q, [key]: e.target.value }));
  const setPanel = (id, field, value) => setQuote((q) => ({
    ...q,
    panels: { ...q.panels, [id]: { ...q.panels[id], [field]: value } }
  }));
  const total = Object.values(quote.panels).reduce((sum, p) => {
    if (!p.checked) return sum;
    return sum + (parseFloat(p.price) || 0);
  }, 0);
  const affectedCount = Object.values(quote.panels).filter((p) => p.checked).length;
  const handleVinScan = (vin) => {
    setQuote((q) => ({ ...q, vin }));
    setScanning(false);
  };
  const handleLinkJob = (e) => {
    const v = vehicles.find((veh) => veh.id === e.target.value);
    if (!v) return;
    setQuote((q) => ({
      ...q,
      vin: v.vin || "",
      year: v.year || "",
      make: v.make || "",
      model: v.model || "",
      color: v.color || "",
      plate: v.plate || "",
      customerName: v.customerName || "",
      insuranceCompany: v.insuranceCompany || "",
      claimNumber: v.claimNumber || ""
    }));
    e.target.value = "";
  };
  const handleClear = () => {
    if (window.confirm("Clear this quote and start over?")) {
      setQuote(BLANK_QUOTE);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "quote-wrap", id: "quote-print-area", children: [
    scanning && /* @__PURE__ */ jsx(VinScanner, { onScan: handleVinScan, onClose: () => setScanning(false) }),
    /* @__PURE__ */ jsxs("div", { className: "panel", children: [
      /* @__PURE__ */ jsxs("div", { className: "panel-head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { children: "New Quote" }),
          /* @__PURE__ */ jsx("p", { className: "meta", children: "Damage assessment & price estimate" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "button ghost sm", onClick: handleClear, children: "Clear" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "button primary sm", onClick: () => window.print(), children: "Print / Save PDF" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "panel-body", children: [
        vehicles.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginBottom: 18 }, children: [
          /* @__PURE__ */ jsx("label", { children: "Auto-fill from existing job" }),
          /* @__PURE__ */ jsxs("select", { defaultValue: "", onChange: handleLinkJob, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "— Select a job to pre-fill —" }),
            vehicles.map((v) => /* @__PURE__ */ jsxs("option", { value: v.id, children: [
              v.id,
              " · ",
              v.year,
              " ",
              v.make,
              " ",
              v.model,
              " · ",
              v.customerName
            ] }, v.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "quote-vin-row", children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsx("label", { children: "VIN #" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: quote.vin,
                onChange: setField("vin"),
                maxLength: 17,
                placeholder: "17-character VIN",
                className: "quote-vin-input"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "button primary btn-scan-vin", onClick: () => setScanning(true), children: "📷 Scan VIN" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-grid-3", style: { marginTop: 10 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Year" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.year, onChange: setField("year"), placeholder: "2022" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Make" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.make, onChange: setField("make"), placeholder: "Honda" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Model" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.model, onChange: setField("model"), placeholder: "Accord" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-grid-3", style: { marginTop: 8 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Color" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.color, onChange: setField("color") })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Plate" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.plate, onChange: setField("plate"), style: { textTransform: "uppercase" } })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Customer name" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.customerName, onChange: setField("customerName") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-grid-2", style: { marginTop: 8 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Insurance company" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.insuranceCompany, onChange: setField("insuranceCompany") })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { children: "Claim #" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: quote.claimNumber, onChange: setField("claimNumber") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel", style: { marginTop: 20 }, children: [
      /* @__PURE__ */ jsxs("div", { className: "panel-head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { children: "Panel Assessment" }),
          /* @__PURE__ */ jsxs("p", { className: "meta", children: [
            affectedCount,
            " panel",
            affectedCount !== 1 ? "s" : "",
            " affected · Check each damaged panel"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "quote-method-legend", children: [
          /* @__PURE__ */ jsx("span", { className: "qlabel pdr", children: "PDR" }),
          /* @__PURE__ */ jsx("span", { className: "qlabel ri", children: "R&I" }),
          /* @__PURE__ */ jsx("span", { className: "qlabel rr", children: "R&R" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "quote-panel-wrap", children: PANEL_SECTIONS.map((section) => {
        const sectionPanels = PDR_PANELS.filter((p) => p.section === section);
        return /* @__PURE__ */ jsxs("div", { className: "quote-panel-section", children: [
          /* @__PURE__ */ jsx("div", { className: "quote-section-label", children: section }),
          /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { className: "quote-panel-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { width: 36 } }),
              /* @__PURE__ */ jsx("th", { children: "Panel" }),
              /* @__PURE__ */ jsx("th", { style: { width: 100 }, children: "Method" }),
              /* @__PURE__ */ jsx("th", { style: { width: 72 }, children: "Dents" }),
              /* @__PURE__ */ jsx("th", { style: { width: 110 }, children: "Size" }),
              /* @__PURE__ */ jsx("th", { style: { width: 100 }, children: "Price" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: sectionPanels.map((p) => {
              const pv = quote.panels[p.id];
              const isRR = pv.method === "R&R";
              return /* @__PURE__ */ jsxs("tr", { className: `quote-panel-row${pv.checked ? " is-affected" : ""}`, children: [
                /* @__PURE__ */ jsx("td", { style: { textAlign: "center" }, children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: pv.checked,
                    onChange: (e) => setPanel(p.id, "checked", e.target.checked),
                    "aria-label": `Mark ${p.label} affected`
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "quote-panel-name", children: p.label }),
                /* @__PURE__ */ jsx("td", { children: pv.checked && /* @__PURE__ */ jsx("select", { value: pv.method, onChange: (e) => setPanel(p.id, "method", e.target.value), className: "quote-select", children: PANEL_METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: m }, m)) }) }),
                /* @__PURE__ */ jsx("td", { children: pv.checked && !isRR && /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: pv.dents,
                    onChange: (e) => setPanel(p.id, "dents", e.target.value),
                    min: "0",
                    className: "quote-num-input",
                    placeholder: "0"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { children: pv.checked && !isRR && /* @__PURE__ */ jsx("select", { value: pv.size, onChange: (e) => setPanel(p.id, "size", e.target.value), className: "quote-select", children: PANEL_SIZES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) }) }),
                /* @__PURE__ */ jsx("td", { children: pv.checked && /* @__PURE__ */ jsxs("div", { className: "quote-price-cell", children: [
                  /* @__PURE__ */ jsx("span", { className: "quote-price-prefix", children: "$" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: pv.price,
                      onChange: (e) => setPanel(p.id, "price", e.target.value),
                      min: "0",
                      step: "5",
                      className: "quote-price-input",
                      placeholder: "0"
                    }
                  )
                ] }) })
              ] }, p.id);
            }) })
          ] }) })
        ] }, section);
      }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "panel quote-footer-panel", style: { marginTop: 20 }, children: /* @__PURE__ */ jsxs("div", { className: "quote-footer-inner", children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("label", { children: "Notes / Exclusions" }),
        /* @__PURE__ */ jsx("textarea", { rows: "4", value: quote.notes, onChange: setField("notes"), placeholder: "Repair conditions, exclusions, special instructions…" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "quote-total-box", children: [
        /* @__PURE__ */ jsx("div", { className: "quote-total-label", children: "Estimated Total" }),
        /* @__PURE__ */ jsxs("div", { className: "quote-total-amount", children: [
          "$",
          total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "quote-total-meta", children: [
          affectedCount,
          " panel",
          affectedCount !== 1 ? "s" : "",
          " · AllDent PDR"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "button primary", style: { width: "100%", marginTop: 14 }, onClick: () => window.print(), children: "Print / Save PDF" })
      ] })
    ] }) })
  ] });
}
function RegisterView({ form, setForm, onSubmit, saveMessage }) {
  const onField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return /* @__PURE__ */ jsxs("section", { className: "panel", style: { maxWidth: 800 }, children: [
    /* @__PURE__ */ jsx("div", { className: "panel-head", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { children: "Register a vehicle" }),
      /* @__PURE__ */ jsx("p", { className: "meta", style: { margin: "2px 0 0" }, children: "Creates a customer-visible job in the portal." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "panel-body", children: /* @__PURE__ */ jsxs("form", { onSubmit, children: [
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", children: "Customer Information" }),
      /* @__PURE__ */ jsx("label", { children: "Customer name" }),
      /* @__PURE__ */ jsx("input", { type: "text", value: form.customerName, onChange: onField("customerName"), required: true }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Cell phone" }),
          /* @__PURE__ */ jsx("input", { type: "tel", value: form.phone, onChange: onField("phone") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Home phone" }),
          /* @__PURE__ */ jsx("input", { type: "tel", value: form.homePhone, onChange: onField("homePhone") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Customer email" }),
          /* @__PURE__ */ jsx("input", { type: "email", value: form.email, onChange: onField("email"), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "How did you hear about us?" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.howHeardAboutUs, onChange: onField("howHeardAboutUs") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("label", { children: "Address" }),
      /* @__PURE__ */ jsx("input", { type: "text", value: form.address, onChange: onField("address") }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "City" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.city, onChange: onField("city") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "State" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.state, onChange: onField("state"), maxLength: 2, style: { textTransform: "uppercase" } })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "ZIP" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.zip, onChange: onField("zip"), maxLength: 10 })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 28 }, children: "Insurance / Vehicle Information" }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Insurance company" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.insuranceCompany, onChange: onField("insuranceCompany") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Deductible" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.deductible, onChange: onField("deductible"), placeholder: "$" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Claim #" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.claimNumber, onChange: onField("claimNumber") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Year" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.year, onChange: onField("year"), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Make" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.make, onChange: onField("make"), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Model" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.model, onChange: onField("model"), required: true })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "VIN #" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.vin, onChange: onField("vin"), maxLength: 17, style: { textTransform: "uppercase" } })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Color" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.color, onChange: onField("color") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "License plate" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: form.plate, onChange: onField("plate"), required: true, style: { textTransform: "uppercase" } })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h4", { className: "form-section-label", style: { marginTop: 28 }, children: "Job Settings" }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Initial status" }),
          /* @__PURE__ */ jsx("select", { value: form.status, onChange: onField("status"), children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { children: "Notification channel" }),
          /* @__PURE__ */ jsxs("select", { value: form.notificationChannel, onChange: onField("notificationChannel"), children: [
            /* @__PURE__ */ jsx("option", { value: "email", children: "Email" }),
            /* @__PURE__ */ jsx("option", { value: "web-push", children: "Web Push (future)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("label", { children: "Repair notes (visible to customer)" }),
      /* @__PURE__ */ jsx("textarea", { rows: "3", value: form.notes, onChange: onField("notes"), placeholder: "Brief notes about the repair plan…" }),
      /* @__PURE__ */ jsxs("div", { className: "checkbox-row", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "reg-notify",
            type: "checkbox",
            checked: form.notificationsEnabled,
            onChange: (e) => setForm({ ...form, notificationsEnabled: e.target.checked })
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "reg-notify", children: "Enable status notifications for this customer" })
      ] }),
      saveMessage && /* @__PURE__ */ jsx("p", { className: "portal-note", style: { marginBottom: 12 }, children: saveMessage }),
      /* @__PURE__ */ jsx("button", { className: "button primary", type: "submit", children: "Create job" })
    ] }) })
  ] });
}

const $$AdminDashboard = createComponent(($$result, $$props, $$slots) => {
  const title = "Admin Dashboard | AllDent PDR";
  const description = "Admin dashboard for AllDent PDR vehicle registration and work-status management.";
  const canonical = "https://alldentpdr.com/portal/admin-dashboard";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "canonical": canonical, "noindex": true, "bare": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AdminDashboardPanel", AdminDashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/components/AdminDashboard.jsx", "client:component-export": "default" })} ` })}`;
}, "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/portal/admin-dashboard.astro", void 0);

const $$file = "C:/Users/dreww/OneDrive - Premier Digital Solution/Premier Digital Solutions/Premier Sites/alldentpdr/src/pages/portal/admin-dashboard.astro";
const $$url = "/portal/admin-dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AdminDashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
