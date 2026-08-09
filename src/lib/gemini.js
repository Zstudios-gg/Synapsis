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
            "MUY IMPORTANTE: transcribe únicamente lo que puedas escuchar con claridad. " +
            "Si una parte del audio es inaudible, tiene demasiado ruido, o el silencio/ruido es " +
            "predominante, escribe [inaudible] en ese tramo en vez de inventar o adivinar palabras. " +
            "Si el audio completo no tiene voz humana entendible, responde únicamente: " +
            "\"[No se detectó voz clara en este audio]\". " +
            "Nunca inventes contenido que no esté realmente en el audio. " +
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

async function llamarGemini(contents, generationConfig) {
  const body = { contents };
  if (generationConfig) body.generationConfig = generationConfig;

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// Descarga un adjunto ya subido a Firebase Storage y lo prepara como "parte"
// de contenido multimodal para Gemini (funciona igual para imágenes y PDFs).
async function adjuntoAParteGemini(adjunto) {
  const res = await fetch(adjunto.urlStorage);
  if (!res.ok) throw new Error(`No se pudo descargar el adjunto "${adjunto.nombreArchivo}".`);
  const blob = await res.blob();
  const base64 = await fileToBase64(blob);
  const mimeType = blob.type || (adjunto.tipo === "pdf" ? "application/pdf" : "image/jpeg");
  return { inline_data: { mime_type: mimeType, data: base64 } };
}

// Extrae el primer bloque JSON válido de un texto, aunque venga envuelto en
// ```json ... ``` o con texto extra alrededor (algunos modelos lo hacen pese
// a que se les pida JSON puro).
function extraerJSON(texto) {
  const limpio = texto.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) throw new Error("La IA no devolvió un JSON reconocible.");
  return JSON.parse(limpio.slice(inicio, fin + 1));
}

// Genera un quiz mixto (opción múltiple + abiertas) a partir de notas de texto
// y/o adjuntos (imágenes, PDFs) que el usuario seleccionó.
export async function generarQuiz({ notas = [], adjuntos = [], cantidad = 8 }) {
  if (notas.length === 0 && adjuntos.length === 0) {
    throw new Error("Selecciona al menos una nota o adjunto para generar el quiz.");
  }

  const partes = [
    {
      text:
        `Eres un profesor creando un quiz de estudio en español a partir del siguiente material. ` +
        `Genera exactamente ${cantidad} preguntas, mezclando preguntas de opción múltiple (4 opciones, una sola correcta) ` +
        `y preguntas abiertas (de desarrollo corto). Procura un balance razonable entre ambos tipos. ` +
        `Las preguntas deben cubrir los conceptos más importantes del material, variar en dificultad, y no ser triviales ` +
        `ni repetitivas entre sí. Para las de opción múltiple, las 3 opciones incorrectas deben ser creíbles (no absurdas obvias). ` +
        `Para las abiertas, incluye una "respuestaModelo" breve (2-4 líneas) que sirva como referencia para calificar.\n\n` +
        `Responde ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional, sin explicaciones, sin markdown:\n` +
        `{"preguntas":[{"tipo":"opcion_multiple","pregunta":"...","tema":"...","opciones":["...","...","...","..."],"respuestaCorrecta":0},` +
        `{"tipo":"abierta","pregunta":"...","tema":"...","respuestaModelo":"..."}]}\n\n` +
        `Material:`,
    },
  ];

  for (const n of notas) {
    partes.push({ text: `\n--- Nota: "${n.titulo}" ---\n${n.contenido || "(sin contenido)"}` });
  }

  for (const a of adjuntos) {
    partes.push({ text: `\n--- Adjunto: "${a.nombreArchivo}" ---` });
    partes.push(await adjuntoAParteGemini(a));
  }

  const contents = [{ role: "user", parts: partes }];
  const data = await llamarGemini(contents);

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("La IA no devolvió un quiz válido.");

  let parsed;
  try {
    parsed = extraerJSON(raw);
  } catch {
    throw new Error("La IA devolvió un formato inesperado. Intenta generar el quiz de nuevo.");
  }

  const preguntas = (parsed.preguntas || [])
    .filter((p) => p.tipo === "opcion_multiple" ? Array.isArray(p.opciones) && p.opciones.length >= 2 : true)
    .map((p, i) => ({ id: `q${i}`, ...p }));

  if (preguntas.length === 0) throw new Error("La IA no generó preguntas utilizables. Intenta de nuevo.");
  return preguntas;
}

const EVAL_PROMPT_FORMATO =
  `Responde ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional, sin markdown:\n` +
  `{"evaluaciones":[{"puntaje":85,"correcta":true,"feedback":"..."}]}`;

// Evalúa en batch las respuestas abiertas del usuario contra la respuesta
// modelo de cada pregunta. Devuelve un array alineado por índice con `items`.
export async function evaluarRespuestasAbiertas(items) {
  if (items.length === 0) return [];

  const listado = items
    .map(
      (it, i) =>
        `${i + 1}. Pregunta: ${it.pregunta}\nRespuesta modelo: ${it.respuestaModelo}\nRespuesta del estudiante: ${
          it.respuestaUsuario?.trim() || "(sin responder)"
        }`
    )
    .join("\n\n");

  const contents = [
    {
      role: "user",
      parts: [
        {
          text:
            `Eres un profesor calificando respuestas de un quiz de estudio. Para cada una de las siguientes ` +
            `${items.length} preguntas, compara la respuesta del estudiante contra la respuesta modelo y da un puntaje ` +
            `de 0 a 100 (sé razonable: no exijas texto idéntico, evalúa si la idea central está correcta), más un ` +
            `feedback breve y constructivo en español (1-2 líneas). "correcta" debe ser true si el puntaje es >= 60. ` +
            `Si no respondió, el puntaje es 0. Devuelve las evaluaciones EN EL MISMO ORDEN que las preguntas.\n\n` +
            `${EVAL_PROMPT_FORMATO}\n\nPreguntas:\n${listado}`,
        },
      ],
    },
  ];

  const data = await llamarGemini(contents);

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("No se pudieron evaluar las respuestas.");

  const parsed = extraerJSON(raw);
  return parsed.evaluaciones || [];
}

const PASOS_PROMPT_SISTEMA =
  `Eres un profesor explicando un ejercicio paso a paso a un estudiante que está ` +
  `desesperado por entender el procedimiento, no solo por ver el resultado final.\n\n` +
  `Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown. Usa exactamente ` +
  `uno de estos dos formatos:\n\n` +
  `1) Si el contenido tiene más de un ejercicio y no es obvio cuál explicar:\n` +
  `{"tipo":"elegir_ejercicio","opciones":["enunciado corto del ejercicio 1","enunciado corto del ejercicio 2"]}\n\n` +
  `2) Si ya identificaste el ejercicio a explicar (o el usuario ya eligió uno):\n` +
  `{"tipo":"pasos","pasos":[{"texto":"explicación breve de este paso en español, puedes usar markdown y $formulas$ inline","geogebra":["comando1","comando2"]}]}\n\n` +
  `Reglas para el campo "geogebra" de cada paso:\n` +
  `- Úsalo SOLO si el ejercicio es de funciones, gráficas, geometría o cálculo y el comando aporta algo ` +
  `visual real (graficar una función, marcar un punto, trazar una derivada, resaltar una intersección, etc).\n` +
  `- Usa sintaxis nativa de GeoGebra (ej: "f(x)=x^2+3x", "Derivada(f)", "Interseca(f,g)", "A=(2,3)").\n` +
  `- Si el paso es puramente conceptual, algebraico sin gráfica, o de una materia no gráfica (química, ` +
  `historia, etc), deja "geogebra" como un arreglo vacío []. No lo fuerces.\n` +
  `- Los comandos son acumulativos: cada paso agrega sobre lo ya dibujado, no repitas comandos de pasos ` +
  `anteriores salvo que el paso actual los necesite de nuevo.\n\n` +
  `Genera entre 3 y 8 pasos. Cada paso enseña UNA idea, no resuelve todo de un salto.`;

/**
 * Genera una explicación paso a paso (texto + comandos GeoGebra opcionales)
 * a partir de: un texto libre/nota, un adjunto guardado, o una pregunta
 * fallida del quiz.
 *
 * origen:
 *   { tipo: "texto", valor }                                         → nota, selección, o ejercicio escrito
 *   { tipo: "adjunto", adjunto }                                     → objeto de Firestore con urlStorage
 *   { tipo: "quiz", pregunta, respuestaUsuario, respuestaCorrecta }  → pregunta fallida del quiz
 *
 * opcionElegida: cuando el usuario ya eligió uno de los "opciones" que
 * devolvió una llamada anterior con tipo "elegir_ejercicio".
 */
export async function generarPasos(origen, opcionElegida = null) {
  let parts;

  if (origen.tipo === "texto") {
    let texto = `${PASOS_PROMPT_SISTEMA}\n\nContenido:\n${origen.valor}`;
    if (opcionElegida) {
      texto += `\n\nEl usuario ya eligió explicar este ejercicio: "${opcionElegida}". Genera directamente los pasos (tipo "pasos"), no vuelvas a preguntar.`;
    }
    parts = [{ text: texto }];
  } else if (origen.tipo === "adjunto") {
    parts = [
      { text: `${PASOS_PROMPT_SISTEMA}\n\nContenido del adjunto "${origen.adjunto.nombreArchivo}" a continuación:` },
      await adjuntoAParteGemini(origen.adjunto),
    ];
    if (opcionElegida) {
      parts.push({
        text: `El usuario ya eligió explicar este ejercicio: "${opcionElegida}". Genera directamente los pasos (tipo "pasos"), no vuelvas a preguntar.`,
      });
    }
  } else if (origen.tipo === "quiz") {
    const { pregunta, respuestaUsuario, respuestaCorrecta } = origen;
    parts = [
      {
        text:
          `${PASOS_PROMPT_SISTEMA}\n\nEl estudiante falló esta pregunta de un quiz:\n` +
          `Pregunta: ${pregunta}\nSu respuesta: ${respuestaUsuario}\nRespuesta correcta: ${respuestaCorrecta}\n\n` +
          `Explica paso a paso cómo se llega a la respuesta correcta. Genera directamente los pasos (tipo "pasos"), ` +
          `este caso nunca tiene ambigüedad de "elegir_ejercicio".`,
      },
    ];
  } else {
    throw new Error("Origen de ejercicio no reconocido.");
  }

  const contents = [{ role: "user", parts }];
  const data = await llamarGemini(contents);

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("La IA no devolvió una explicación válida.");

  try {
    return extraerJSON(raw);
  } catch {
    throw new Error("La IA devolvió un formato inesperado. Intenta de nuevo.");
  }
}