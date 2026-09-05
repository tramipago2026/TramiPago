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
      .eligibility-list {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 14px !important;
      }
      .eligibility-question {
        min-width: 0;
        margin: 0 !important;
        padding: 13px 16px !important;
        border: 2px solid #a8cde9 !important;
        border-radius: 999px !important;
      }
      .eligibility-question legend {
        max-width: 100%;
        margin: 0 auto 6px;
        padding: 0 8px;
        text-align: center;
        font-weight: 700;
      }
      .eligibility-options {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .eligibility-options .choice-option {
        justify-content: center;
        min-height: 38px !important;
        padding: 6px 10px !important;
        border-radius: 999px !important;
      }
      .site-footer .footer-inner {
        align-items: flex-start !important;
        gap: 14px !important;
      }
      .site-footer .legal-links {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-end !important;
        gap: 3px 10px !important;
        max-width: 760px;
        margin-left: auto;
        line-height: 1.25;
        text-align: right;
      }
      .site-footer .legal-links a {
        color: #fff !important;
        font-size: 10px !important;
        font-weight: 400 !important;
        text-decoration-thickness: 1px !important;
        text-underline-offset: 2px !important;
        white-space: nowrap;
      }
      .site-footer .legal-links a:hover,
      .site-footer .legal-links a:focus-visible {
        color: #29B6F6 !important;
      }
      .site-footer .consumer-legal-note {
        flex-basis: 100%;
        color: rgba(255,255,255,.72);
        font-size: 9px;
        font-weight: 400;
        line-height: 1.25;
        text-align: right;
      }
      @media (max-width: 620px) {
        .payment-access { grid-template-columns: 1fr !important; }
        .eligibility-list { grid-template-columns: 1fr !important; }
        .site-footer .footer-inner { display: block !important; }
        .site-footer .legal-links {
          justify-content: flex-start !important;
          margin: 7px 0 0 !important;
          text-align: left !important;
        }
        .site-footer .consumer-legal-note { text-align: left !important; }
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

  function ensureConsumerLinks() {
    const legalLinks = document.querySelector(".site-footer .legal-links");
    if (!legalLinks) return;

    const links = [
      { href: "arrepentimiento.html", text: "BOTÓN DE ARREPENTIMIENTO", key: "consumer-withdrawal" },
      { href: "baja-servicio.html", text: "BOTÓN DE BAJA DE SERVICIO", key: "consumer-cancel" }
    ];

    links.forEach((item) => {
      if (legalLinks.querySelector(`[data-legal-link="${item.key}"]`)) return;
      const anchor = document.createElement("a");
      anchor.href = item.href;
      anchor.textContent = item.text;
      anchor.setAttribute("data-legal-link", item.key);
      legalLinks.appendChild(anchor);
    });

    if (!legalLinks.querySelector(".consumer-legal-note")) {
      const note = document.createElement("span");
      note.className = "consumer-legal-note";
      note.textContent = "Revocación y baja por canal digital · sin registración previa · respuesta con código de solicitud dentro de 24 h.";
      legalLinks.appendChild(note);
    }
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
    ensureConsumerLinks();
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
