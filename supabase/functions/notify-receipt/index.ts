// BORRADOR: no desplegar hasta probar con base aislada y configurar correo.
// Se invoca DESPUÉS de registrar el comprobante mediante register_public_payment_receipt.
// El token de solicitud se valida en servidor. Nunca recibir credenciales de administración.
import { createClient } from "npm:@supabase/supabase-js@2.105.0";

type NotificationState = "sent" | "pending" | "failed" | "retry_later";
const CODE_RE = /^[A-Z0-9]{1,4}-[0-9]{6}-[A-F0-9]{8}$/;
function cors(origin: string | null) {
  const allowed = Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://tramipago2026.github.io";
  return {
    "Access-Control-Allow-Origin": origin === allowed || origin?.startsWith("http://localhost:") ? origin : allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function reply(origin: string | null, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}
async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function sendEmail(code: string, service: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("ADMIN_EMAIL");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!key || !to || !from) throw new Error("email_not_configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Comprobante para revisar ${code}`,
      text: `Se recibió un comprobante.\nCódigo: ${code}\nTrámite: ${service}\nRevisá el pago en el panel. No está acreditado automáticamente.`,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok) throw new Error("email_provider_failed");
  return payload.id ?? null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (request.method !== "POST") return reply(origin, { error: "Método no permitido" }, 405);
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim().toUpperCase();
    const token = String(body?.requestToken || "");
    if (!CODE_RE.test(code) || !/^[a-f0-9]{48}$/.test(token)) {
      return reply(origin, { error: "Solicitud no válida" }, 403);
    }
    const url = Deno.env.get("SUPABASE_URL");
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !secret) throw new Error("backend_not_configured");
    const db = createClient(url, secret, { auth: { persistSession: false } });
    const { data: item, error: itemError } = await db.from("requests")
      .select("id,public_token_hash,status,services(name)")
      .eq("tracking_code", code).single();
    if (itemError || !item || await hashToken(token) !== item.public_token_hash) {
      return reply(origin, { error: "Solicitud no válida" }, 403);
    }
    if (item.status !== "payment_review") {
      return reply(origin, { error: "El comprobante todavía no está en revisión" }, 409);
    }
    const { data: file, error: fileError } = await db.from("request_files")
      .select("id").eq("request_id", item.id).eq("kind", "payment_receipt").limit(1).maybeSingle();
    if (fileError) throw fileError;
    if (!file) return reply(origin, { error: "No hay comprobante registrado" }, 409);

    const now = new Date().toISOString();
    const { data: firstClaim, error: claimError } = await db.from("notifications")
      .insert({ request_id: item.id, channel: "email", status: "pending", attempts: 1, next_attempt_at: now })
      .select("id").single();
    let claimedId: number | null = firstClaim?.id ?? null;
    if (claimError) {
      if (claimError.code !== "23505") throw claimError;
      const { data: existing, error: existingError } = await db.from("notifications")
        .select("id,status,next_attempt_at,attempts").eq("request_id", item.id).eq("channel", "email").single();
      if (existingError || !existing) throw existingError || new Error("notification_not_found");
      if (existing.status === "sent") return reply(origin, { ok: true, status: "payment_review", notification: "sent" });
      if (existing.status === "pending") return reply(origin, { ok: true, status: "payment_review", notification: "pending" });
      if (existing.status !== "failed" || Date.parse(existing.next_attempt_at) > Date.now()) {
        return reply(origin, { ok: true, status: "payment_review", notification: "retry_later" });
      }
      // Claim condicional: solamente uno de dos reintentos concurrentes cambia failed -> pending.
      const { data: retried, error: retryError } = await db.from("notifications")
        .update({ status: "pending", attempts: existing.attempts + 1, next_attempt_at: now, last_error: null })
        .eq("id", existing.id).eq("status", "failed").lte("next_attempt_at", now)
        .select("id").maybeSingle();
      if (retryError) throw retryError;
      if (!retried) return reply(origin, { ok: true, status: "payment_review", notification: "pending" });
      claimedId = retried.id;
    }
    if (claimedId === null) throw new Error("notification_claim_failed");

    try {
      const related = item.services as { name?: string } | { name?: string }[] | null;
      const service = (Array.isArray(related) ? related[0]?.name : related?.name) || "Trámite";
      const providerId = await sendEmail(code, service);
      const { error: updateError } = await db.from("notifications")
        .update({ status: "sent", provider_id: providerId, sent_at: new Date().toISOString(), last_error: null })
        .eq("id", claimedId);
      if (updateError) throw updateError;
      return reply(origin, { ok: true, status: "payment_review", notification: "sent" });
    } catch (_error) {
      await db.from("notifications")
        .update({ status: "failed", last_error: "notification_delivery_failed", next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString() })
        .eq("id", claimedId);
      return reply(origin, { ok: true, status: "payment_review", notification: "failed" });
    }
  } catch (_error) {
    return reply(origin, { error: "No se pudo procesar el aviso" }, 500);
  }
});
