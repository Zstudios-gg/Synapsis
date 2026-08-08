const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function preguntarIA({ pregunta, contextoTexto, historial = [] }) {
  let promptFinal = pregunta;
  if (contextoTexto) {
    promptFinal =
      `Contexto del usuario (una nota o archivo que subió a su carpeta de estudio):\n"""\n${contextoTexto}\n"""\n\n` +
      `Pregunta del usuario: ${pregunta}\n\n` +
      `Responde usando el contexto cuando sea relevante. Si el contexto no tiene relación con la pregunta, ` +
      `respóndela de todas formas con tu conocimiento general.`;
  }

  const contents = [
    ...(historial || []).map((m) => ({
      role: m.remitente === "usuario" ? "user" : "model",
      parts: [{ text: m.texto }],
    })),
    { role: "user", parts: [{ text: promptFinal }] },
  ];

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("Error llamando a Gemini:", res.status, errBody);
    throw new Error("No se pudo obtener respuesta de la IA. Intenta de nuevo.");
  }

  const data = await res.json();
  const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!respuesta) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  return respuesta;
}
