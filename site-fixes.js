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
      .consumer-rights-bar {
        width: min(1120px, calc(100% - 40px));
        margin: 8px auto 0;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .consumer-rights-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        padding: 5px 10px;
        color: #103b68;
        background: #fff;
        border: 1px solid #a8cde9;
        border-radius: 999px;
        font-size: .74rem;
        font-weight: 500;
        line-height: 1.15;
        text-decoration: none;
        box-shadow: 0 1px 3px rgba(8,42,71,.08);
      }
      .consumer-rights-link:hover,
      .consumer-rights-link:focus-visible {
        color: #fff;
        background: #0b3d66;
        border-color: #0b3d66;
        outline: none;
      }
      @media (max-width: 620px) {
        .payment-access { grid-template-columns: 1fr !important; }
        .eligibility-list { grid-template-columns: 1fr !important; }
        .consumer-rights-bar {
          width: min(100% - 24px, 1120px);
          justify-content: center;
          gap: 6px;
        }
        .consumer-rights-link {
          flex: 1 1 210px;
          font-size: .70rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureConsumerRightsLinks() {
    if (document.querySelector(".consumer-rights-bar")) return;
    const header = document.querySelector(".site-header");
    if (!header) return;

    const bar = document.createElement("div");
    bar.className = "consumer-rights-bar";
    bar.setAttribute("aria-label", "Derechos del consumidor");
    bar.innerHTML = `
      <a class="consumer-rights-link" href="https://wa.me/5491167083232?text=Solicito%20ejercer%20el%20derecho%20de%20arrepentimiento%20de%20mi%20contrataci%C3%B3n%20en%20TramiPago." target="_blank" rel="noopener noreferrer">BOTÓN DE ARREPENTIMIENTO</a>
      <a class="consumer-rights-link" href="https://wa.me/5491167083232?text=Solicito%20la%20baja%20del%20servicio%20contratado%20en%20TramiPago." target="_blank" rel="noopener noreferrer">BOTÓN DE BAJA DE SERVICIO</a>
    `;
    header.insertAdjacentElement("afterend", bar);
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
    ensureConsumerRightsLinks();
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
