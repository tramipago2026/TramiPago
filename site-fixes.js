(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  function injectStyles() {
    if (document.getElementById("tramipago-site-review-styles")) return;
    const style = document.createElement("style");
    style.id = "tramipago-site-review-styles";
    style.textContent = `
      .payment-access { grid-template-columns: 190px minmax(0,1fr) !important; }
      .payment-qr { width: 166px !important; height: 166px !important; }
      .tracking-new-query {
        margin-top: 16px;
        color: #103b68 !important;
        background: #fff !important;
      }
      @media (max-width: 620px) {
        .payment-access { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function fixAdminLink() {
    document.querySelectorAll("a.local-admin-link").forEach((link) => {
      if (link.getAttribute("href") !== "admin/index.html") {
        link.setAttribute("href", "admin/index.html");
      }
    });
  }

  function enhanceTracking() {
    const form = document.getElementById("tracking-form");
    if (!form) return;
    const submit = form.querySelector('button[type="submit"], button[data-tracking-new-query]');
    if (!submit) return;

    const hasResult = Boolean(document.querySelector(".tracking-result .status-header"));
    if (hasResult && !submit.hasAttribute("data-tracking-new-query")) {
      submit.type = "button";
      submit.textContent = "Consultar otro código";
      submit.setAttribute("data-tracking-new-query", "true");
      submit.classList.add("button-secondary", "tracking-new-query");
      submit.classList.remove("button-primary");
      return;
    }

    if (!hasResult && submit.hasAttribute("data-tracking-new-query")) {
      submit.type = "submit";
      submit.textContent = "Consultar";
      submit.removeAttribute("data-tracking-new-query");
      submit.classList.add("button-primary");
      submit.classList.remove("button-secondary", "tracking-new-query");
    }
  }

  function enhance() {
    fixAdminLink();
    enhanceTracking();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tracking-new-query]");
    if (!button) return;
    event.preventDefault();
    const form = document.getElementById("tracking-form");
    const input = form?.elements.namedItem("trackingCode");
    if (!input) return;
    input.value = "";
    button.type = "submit";
    button.textContent = "Consultar";
    button.removeAttribute("data-tracking-new-query");
    button.classList.add("button-primary");
    button.classList.remove("button-secondary", "tracking-new-query");
    input.focus();
  });

  injectStyles();
  new MutationObserver(() => window.requestAnimationFrame(enhance)).observe(document.body, { childList: true, subtree: true });
  enhance();
})();
