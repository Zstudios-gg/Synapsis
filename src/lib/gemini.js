import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Llama a la Cloud Function "preguntarIA" (ver functions/index.js).
// El texto del contexto anclado (nota o adjunto) se manda junto a la pregunta;
// la Cloud Function arma el prompt final y llama a la API de Gemini de forma segura.
export async function preguntarIA({ pregunta, contextoTexto, historial = [] }) {
  const preguntarIACallable = httpsCallable(functions, "preguntarIA");
  const res = await preguntarIACallable({ pregunta, contextoTexto, historial });
  return res.data.respuesta;
}
