// Asistente de la web: recibe la conversación del chat y responde con Claude en streaming.
// Necesita la variable de entorno ANTHROPIC_API_KEY en Netlify (Site configuration > Environment variables).
// Opcional: BOZU_CHAT_MODEL para cambiar de modelo (por defecto claude-opus-5-5).
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./knowledge.mjs";

const MODEL = process.env.BOZU_CHAT_MODEL || "claude-opus-5-5";
const MAX_TURNS = 12;          // mensajes que se envían como historial
const MAX_CHARS = 800;         // por mensaje del visitante
const MAX_TOTAL_CHARS = 8000;  // de toda la conversación
const PER_MINUTE = 8;          // mensajes por minuto y conexión (mejor esfuerzo: cada instancia lleva su cuenta)
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?bozu\.es$/, /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/, /^https:\/\/[a-z0-9-]+\.netlify\.app$/, /^http:\/\/localhost(:\d+)?$/];

const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > PER_MINUTE;
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === "user" ? MAX_CHARS : 4000) }))
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  let total = 0;
  for (let i = msgs.length - 1; i >= 0; i--) {
    total += msgs[i].content.length;
    if (total > MAX_TOTAL_CHARS) return msgs.slice(i + 1).length ? msgs.slice(i + 1) : null;
  }
  return msgs;
}

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) return json(403, { error: "Origen no permitido" });
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: "El asistente no está configurado" });
  if (tooMany(context?.ip || req.headers.get("x-nf-client-connection-ip") || "anon")) return json(429, { error: "Demasiadas preguntas seguidas. Espera un minuto." });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Petición no válida" }); }
  const messages = cleanMessages(body?.messages);
  if (!messages) return json(400, { error: "Escribe tu pregunta" });

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text) => controller.enqueue(encoder.encode(text));
      try {
        const reply = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          output_config: { effort: "low" },
          // Si el modelo declina por sus filtros de seguridad, la API reintenta con otro modelo adecuado.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages,
        });
        for await (const event of reply) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") send(event.delta.text);
        }
        const final = await reply.finalMessage();
        if (final.stop_reason === "refusal") send("\n\nEsa pregunta no puedo responderla aquí. Si quieres, escríbenos por WhatsApp o agenda una demo y lo vemos contigo.");
        else if (final.stop_reason === "max_tokens") send("…");
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) send("Ahora mismo hay mucha gente preguntando. Prueba en un minuto o escríbenos por WhatsApp.");
        else if (error instanceof Anthropic.AuthenticationError) { console.error("bozu chat: clave de API no válida"); send("El asistente no está disponible ahora mismo. Escríbenos por WhatsApp o agenda una demo."); }
        else if (error instanceof Anthropic.APIError) { console.error("bozu chat: API", error.status, error.message); send("No he podido responder ahora mismo. Prueba de nuevo o escríbenos por WhatsApp."); }
        else { console.error("bozu chat:", error); send("No he podido responder ahora mismo. Prueba de nuevo o escríbenos por WhatsApp."); }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
};

export const config = { path: "/api/chat" };
