"use strict";
(() => {
  function render({ stage = "data", requiresPayment = true, status = "draft", missingDocuments = false } = {}) {
    const host = document.querySelector("[data-v2-progress]");
    if (!host) return;
    if (status === "cancelled") {
      const notice = document.createElement("p");
      notice.className = "notice";
      notice.textContent = "Esta solicitud está cancelada. No hay pasos en curso.";
      host.replaceChildren(notice);
      host.dataset.stage = "cancelled";
      return;
    }
    const steps = requiresPayment ? [["data", "Datos"], ["payment", "Pago"], ["confirmation", "Confirmación"]] : [["data", "Datos"], ["confirmation", "Confirmación"]];
    const paid = ["payment_confirmed", "in_progress", "finalized"].includes(status);
    const sent = status !== "draft" && status !== "cancelled";
    const finished = sent && status !== "needs_info" && (!requiresPayment || paid);
    const active = status === "needs_info" || !sent ? "data" : finished ? "confirmation" : "payment";
    const list = document.createElement("ol");
    list.className = "request-progress";
    for (const [index, [id, title]] of steps.entries()) {
      const done = id === "data" ? sent && status !== "needs_info" : id === "payment" ? paid : finished;
      const current = !done && id === active;
      const item = document.createElement("li");
      item.className = "request-step" + (done ? " done" : current ? " current" : " pending");
      item.dataset.step = id;
      if (current) item.setAttribute("aria-current", "step");
      const number = document.createElement("span");
      number.className = "step-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = done ? "✓" : String(index + 1);
      const label = document.createElement("span");
      label.className = "step-label";
      const name = document.createElement("strong");
      name.textContent = title;
      const state = document.createElement("small");
      state.textContent = done ? "Completo" : current ? id === "data" && (missingDocuments || status === "needs_info") ? "Falta información" : id === "payment" && status === "payment_review" ? "En revisión" : "En curso" : "Pendiente";
      label.append(name, state);
      item.append(number, label);
      list.append(item);
    }
    host.replaceChildren(list);
    host.dataset.stage = stage;
  }

  function summary(host, schema, values) {
    const list = document.createElement("dl");
    list.className = "review-list";
    for (const field of schema?.fields || []) {
      if (["emailConfirm", "authorization", "serviceFeeAcceptance"].includes(field.id)) continue;
      const value = values[field.id];
      if (value === undefined || value === null || value === "" || value === false) continue;
      const term = document.createElement("dt");
      term.textContent = field.label.replace(/\s*\(opcional\)/i, "");
      const detail = document.createElement("dd");
      detail.textContent = field.options?.find(option => option.value === value)?.label || (value === true ? "Sí" : String(value));
      list.append(term, detail);
    }
    if (!list.children.length) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "El resumen se completa con los datos que ingresás.";
      host.replaceChildren(note);
    } else host.replaceChildren(list);
  }
  window.TramiPagoProgress = { render, summary };
})();
