const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// La API key se guarda como "secret" de Firebase, NUNCA en el código:
// firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.preguntarIA = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para usar el chat.");
  }

  const { pregunta, contextoTexto, historial } = request.data;
  if (!pregunta || typeof pregunta !== "string") {
    throw new HttpsError("invalid-argument", "Falta la pregunta.");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let promptFinal = pregunta;
  if (contextoTexto) {
    promptFinal =
      `Contexto del usuario (una nota o archivo que subió a su carpeta de estudio):\n"""\n${contextoTexto}\n"""\n\n` +
      `Pregunta del usuario: ${pregunta}\n\n` +
      `Responde usando el contexto cuando sea relevante. Si el contexto no tiene relación con la pregunta, ` +
      `respóndela de todas formas con tu conocimiento general.`;
  }

  const chat = model.startChat({
    history: (historial || []).map((m) => ({
      role: m.remitente === "usuario" ? "user" : "model",
      parts: [{ text: m.texto }],
    })),
  });

  try {
    const result = await chat.sendMessage(promptFinal);
    const respuesta = result.response.text();
    return { respuesta };
  } catch (err) {
    console.error("Error llamando a Gemini:", err);
    throw new HttpsError("internal", "No se pudo obtener respuesta de la IA. Intenta de nuevo.");
  }
});
