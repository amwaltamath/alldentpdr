import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';

function BeforeAfter({ before, after, alt = "Before and after repair" }) {
  const [showBefore, setShowBefore] = useState(true);
  return /* @__PURE__ */ jsxs("div", { className: "before-after-container", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "before-after-toggle",
        onClick: () => setShowBefore(!showBefore),
        "aria-label": `Show ${showBefore ? "after" : "before"}`,
        children: showBefore ? "Show After" : "Show Before"
      }
    ),
    /* @__PURE__ */ jsx(
      "img",
      {
        src: showBefore ? before : after,
        alt,
        className: "before-after-image"
      }
    )
  ] });
}

export { BeforeAfter as B };
