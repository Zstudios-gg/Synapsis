import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export function detectTipo(file) {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "otro";
}

export async function uploadFile(uid, carpetaId, file) {
  const path = `usuarios/${uid}/carpetas/${carpetaId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, tipo: detectTipo(file), nombreArchivo: file.name };
}
