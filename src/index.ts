/**
 * LLM Chat Application Template - Modificado para bgftech.shop
 */
import { Env, ChatMessage } from "./types";

const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

// System prompt personalizado
const SYSTEM_PROMPT = `Eres un asistente virtual de la tienda bgftech.shop, especializada en productos de diagnóstico automotriz y electrónica. Tu objetivo es ayudar a los clientes proporcionando información sobre los productos disponibles, precios y detalles técnicos. Responde de manera amigable y concisa en español. Si no sabes la respuesta, indícalo amablemente y sugiere consultar directamente en la tienda.`;

const STORE_URL = "https://bgftech.shop/tienda/";

/**
 * Obtiene y procesa el contenido de la tienda
 */
async function fetchStoreData(): Promise<string | null> {
  try {
    const response = await fetch(STORE_URL);
    if (!response.ok) return null;
    const html = await response.text();
    
    // Limpieza básica de HTML
    const textContent = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limitar a 3000 caracteres
    const maxLength = 3000;
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + "..."
      : textContent;
  } catch (error) {
    console.error("Error en fetchStoreData:", error);
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Servir frontend estático
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API de chat
    if (url.pathname === "/api/chat") {
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  try {
    const { messages = [] } = (await request.json()) as { messages: ChatMessage[] };

    // Obtener datos actualizados de la tienda
    const storeData = await fetchStoreData();

    // Construir la lista final de mensajes
    const finalMessages: ChatMessage[] = [];

    if (storeData) {
      finalMessages.push({
        role: "system",
        content: `Información actual de la tienda bgftech.shop:\n${storeData}`
      });
    }

    // Añadir system prompt si no existe
    if (!messages.some(msg => msg.role === "system")) {
      finalMessages.push({ role: "system", content: SYSTEM_PROMPT });
    }

    // Añadir el resto de la conversación
    finalMessages.push(...messages);

    // Llamar al modelo con streaming
    const stream = await env.AI.run(MODEL_ID, {
      messages: finalMessages,
      max_tokens: 1024,
      stream: true,
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error en chat:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}