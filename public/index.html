 /**
 * LLM Chat Application - Adaptado a Primaria Salud Emergencias & Triage (primariasalud.com.ar)
 */
import { Env, ChatMessage } from "./types";

// Modelo LLM recomendado, puedes ajustar según tu proveedor de IA
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

const SYSTEM_PROMPT = `Eres un sistema de triage médico virtual especializado en atención primaria para pacientes en Argentina, de la empresa Primaria Salud (https://www.primariasalud.com.ar). Atiendes consultas sobre síntomas frecuentes, urgencias, cuidado general y orientación en salud. NUNCA haces diagnósticos ni recetas, solo orientas, sugieres y adviertes cuándo se debe acudir al médico o emergencia. Siempre recuerda a los usuarios que esto no reemplaza una consulta presencial. Sigue estos lineamientos:
- Responde siempre en español.
- Si los síntomas son graves, sugiere contactarse urgente con emergencias (107).
- Sé muy claro, cercano y profesional.
- Deja en claro que eres una IA orientativa entrenada por médicos argentinos.
`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Servir frontend
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API de chat principal
    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { messages = [] } = await request.json() as { messages: ChatMessage[] };
      // Anteponer el System Prompt solo si no está presente
      const finalMessages: ChatMessage[] = [
        ...(messages.some(msg => msg.role === "system") ? [] : [{ role: "system", content: SYSTEM_PROMPT }]),
        ...messages,
      ];
      // Solicitud al modelo de lenguaje en streaming
      const stream = await env.AI.run(MODEL_ID, {
        messages: finalMessages,
        max_tokens: 1024,
        stream: true,
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};