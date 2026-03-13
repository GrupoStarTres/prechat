// DOM
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Estado
let chatHistory = [
  {
    role: "assistant",
    content: "Hola, soy el Asistente Médico IA de Primaria Salud. Describe tu síntoma o consulta y te orientaré según protocolos de triage de atención primaria en Argentina."
  }
];
let isProcessing = false;

// Auto-resize y control (puedes mejorarlo con un textarea si te gustaría multinea)
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Enviar por click
sendButton.addEventListener("click", function(e){
  e.preventDefault();
  sendMessage();
});

function addMessageToChat(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (role === "user" ? "user" : "assistant");
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mensaje al cargar: 
addMessageToChat("assistant", chatHistory[0].content);

/**
 * Enviar consulta a la API IA
 */
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "" || isProcessing) return;
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  addMessageToChat("user", message);
  userInput.value = "";
  typingIndicator.style.display = "block";
  chatHistory.push({ role: "user", content: message });

  try {
    // Aquí puedes editar la url si tu backend está en otro origen
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          // System prompt personalizado
          {
            role: "system",
            content: "Eres un sistema de triage médico virtual especializado en atención primaria en Argentina. Tus respuestas son empáticas, orientativas, nunca dan diagnósticos finales ni recetan medicamentos. Siempre recomienda atención presencial ante síntomas graves o dudas. Hablas en español sencillo para pacientes argentinos."
          },
          ...chatHistory.slice(1) // omitimos el mensaje inicial assistant textual
        ]
      }),
    });

    if (!response.ok || !response.body) throw new Error("API error");

    // Procesa respuesta streaming SSE
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partial = "";
    let done = false;
    let aiMessageText = "";
    const assistantDiv = document.createElement("div");
    assistantDiv.className = "message assistant";
    chatMessages.appendChild(assistantDiv);

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        partial += decoder.decode(value, { stream: true });
        // Divide y procesa SSE
        let chunks = partial.split("\n\n");
        partial = chunks.pop(); // lo que quedó incompleto
        for (const chunk of chunks) {
          if (!chunk.includes("data:")) continue;
          const line = chunk.split("data:").pop();
          if (line.trim() === "[DONE]") continue;
          try {
            const data = JSON.parse(line);
            aiMessageText += data.response || (data.choices && data.choices[0].delta && data.choices[0].delta.content) || "";
            assistantDiv.textContent = aiMessageText;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } catch {}
        }
      }
    }
    typingIndicator.style.display = "none";
    aiMessageText = aiMessageText.trim();
    if (aiMessageText) chatHistory.push({ role: "assistant", content: aiMessageText });
  } catch (e) {
    addMessageToChat("assistant", "Ocurrió un error. Intenta de nuevo.");
    typingIndicator.style.display = "none";
  }
  userInput.disabled = false;
  sendButton.disabled = false;
  isProcessing = false;
}