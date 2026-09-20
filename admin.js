(function () {
  "use strict";

  // Conserva el HTML y el diseño aprobados; carga el panel con MFA original.
  const script = document.createElement("script");
  script.src = "admin-mfa.js?v=20260920-mfa-enforced";
  script.async = false;
  script.onerror = function () {
    const message = document.getElementById("login-message");
    if (message) {
      message.textContent = "No se pudo cargar el panel privado.";
      message.className = "message error";
    }
  };
  document.body.appendChild(script);
})();
