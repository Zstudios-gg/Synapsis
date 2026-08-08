import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ---------- Carpetas ----------

export function watchFolders(uid, callback) {
  const ref = collection(db, "usuarios", uid, "carpetas");
  const q = query(ref, orderBy("fechaCreacion", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createFolder(uid, nombre) {
  const ref = collection(db, "usuarios", uid, "carpetas");
  return addDoc(ref, { nombre, fechaCreacion: serverTimestamp() });
}

export async function deleteFolder(uid, carpetaId) {
  return deleteDoc(doc(db, "usuarios", uid, "carpetas", carpetaId));
}

// ---------- Notas ----------

export function watchNotes(uid, carpetaId, callback) {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "notas");
  const q = query(ref, orderBy("fechaEdicion", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createNote(uid, carpetaId, titulo = "Nota sin título") {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "notas");
  return addDoc(ref, { titulo, contenido: "", fechaEdicion: serverTimestamp() });
}

export async function updateNote(uid, carpetaId, notaId, cambios) {
  const ref = doc(db, "usuarios", uid, "carpetas", carpetaId, "notas", notaId);
  return updateDoc(ref, { ...cambios, fechaEdicion: serverTimestamp() });
}

export async function deleteNote(uid, carpetaId, notaId) {
  return deleteDoc(doc(db, "usuarios", uid, "carpetas", carpetaId, "notas", notaId));
}

// ---------- Adjuntos (metadata; el archivo en sí va a Storage) ----------

export function watchAttachments(uid, carpetaId, callback) {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "adjuntos");
  const q = query(ref, orderBy("fechaSubida", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function registerAttachment(uid, carpetaId, { nombreArchivo, tipo, urlStorage }) {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "adjuntos");
  return addDoc(ref, { nombreArchivo, tipo, urlStorage, fechaSubida: serverTimestamp() });
}

export async function deleteAttachment(uid, carpetaId, adjuntoId) {
  return deleteDoc(doc(db, "usuarios", uid, "carpetas", carpetaId, "adjuntos", adjuntoId));
}

// ---------- Chat ----------

export function watchChat(uid, carpetaId, callback) {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "chat");
  const q = query(ref, orderBy("fecha", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addChatMessage(uid, carpetaId, { remitente, texto, contextoAnclado = null }) {
  const ref = collection(db, "usuarios", uid, "carpetas", carpetaId, "chat");
  return addDoc(ref, { remitente, texto, contextoAnclado, fecha: serverTimestamp() });
}
