"use strict";
(() => {
  const form = document.getElementById("withdrawal-form") || document.getElementById("cancel-form");
  if (!form) return;
  const withdrawal = form.id === "withdrawal-form";
  const title = withdrawal ? "SOLICITUD DE ARREPENTIMIENTO - TramiPago" : "SOLICITUD DE BAJA DE SERVICIO - TramiPago";
  function requestText() {
    const data = new FormData(form);
    const field = (key) => String(data.get(key) || "").trim();
    return [
      title,
      "Nombre y apellido: " + field("nombre"),
      "DNI: " + field("dni"),
      "Correo: " + field("email"),
      "WhatsApp: " + field("whatsapp"),
      "Código de solicitud/trámite: " + (field("codigo") || "No informado"),
      "Servicio: " + field("servicio"),
      "Observaciones: " + (field("comentario") || "Sin observaciones"),
      withdrawal ? "Solicito ejercer el derecho de arrepentimiento respecto de la contratación indicada." : "Solicito la baja del servicio indicado."
    ].join("\n");
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    // Abrir un canal externo no significa que el mensaje fue enviado ni registrado.
    window.location.assign("https://wa.me/5491167083232?text=" + encodeURIComponent(requestText()));
  });
  const emailLink = form.querySelector('a[href^="mailto:"]');
  if (emailLink) {
    emailLink.addEventListener("click", event => {
      if (!form.reportValidity()) { event.preventDefault(); return; }
      emailLink.href = "mailto:tramipago@gmail.com?subject=" +
        encodeURIComponent(title) + "&body=" + encodeURIComponent(requestText());
    });
  }
})();