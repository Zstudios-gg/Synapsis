// Llama directo a la API de Gemini desde el navegador (sin Cloud Functions,
// para no depender del plan Blaze de Firebase).
//
// La API key vive en VITE_GEMINI_API_KEY (variable de entorno / secret de GitHub).
// Como esto corre en el cliente, la key queda visible en el bundle. Para
// mitigarlo, restringe la key en Google AI Studio / Google Cloud Console para
// que solo funcione desde tu dominio (HTTP referrer: https://zstudios-gg.github.io/*).

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

  const data = await llamarGemini(contents);
  const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!respuesta) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  return respuesta;
}

// Transcribe un archivo/blob de audio a texto usando Gemini (entiende audio
// directamente, no hace falta un servicio de transcripción aparte).
export async function transcribirAudio(file) {
  const base64 = await fileToBase64(file);
  const contents = [
    {
      role: "user",
      parts: [
        {
          text:
            "Transcribe este audio a texto en español lo más fielmente posible. " +
            "Si es una clase o apunte hablado, conserva la estructura en párrafos. " +
            "Responde ÚNICAMENTE con la transcripción, sin comentarios, encabezados ni explicaciones adicionales.",
        },
        { inline_data: { mime_type: file.type || "audio/webm", data: base64 } },
      ],
    },
  ];

  const data = await llamarGemini(contents);
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new Error("No se pudo transcribir el audio.");
  }
  return texto.trim();
}

async function llamarGemini(contents) {
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

  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result es "data:audio/webm;base64,AAAA..." — solo nos interesa la parte de datos.
      const base64 = String(reader.result).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
