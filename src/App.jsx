import React, { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import NotesPanel from "./components/NotesPanel";
import ChatPanel from "./components/ChatPanel";
import {
  watchFolders, createFolder,
  watchNotes, createNote, updateNote, deleteNote,
  watchAttachments, registerAttachment, deleteAttachment,
  watchChat, addChatMessage,
} from "./lib/firestore";
import { uploadFile } from "./lib/storage";
import { preguntarIA, transcribirAudio } from "./lib/gemini";

export default function App() {
  const { user, loading, loginWithGoogle, logout } = useAuth();

  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);

  // Carpetas del usuario
  useEffect(() => {
    if (!user) return;
    const unsub = watchFolders(user.uid, setFolders);
    return unsub;
  }, [user]);

  // Notas, adjuntos y chat de la carpeta seleccionada
  useEffect(() => {
    setActiveNote(null);
    setContext(null);
    if (!user || !selectedFolderId) {
      setNotes([]); setAttachments([]); setMessages([]);
      return;
    }
    const unsubNotes = watchNotes(user.uid, selectedFolderId, setNotes);
    const unsubAttach = watchAttachments(user.uid, selectedFolderId, setAttachments);
    const unsubChat = watchChat(user.uid, selectedFolderId, setMessages);
    return () => { unsubNotes(); unsubAttach(); unsubChat(); };
  }, [user, selectedFolderId]);

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted text-sm">Cargando...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={loginWithGoogle} />;
  }

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  async function handleCreateFolder(nombre) {
    const ref = await createFolder(user.uid, nombre);
    setSelectedFolderId(ref.id);
  }

  async function handleCreateNote() {
    if (!selectedFolderId) return;
    const ref = await createNote(user.uid, selectedFolderId);
    setActiveNote({ id: ref.id, titulo: "Nota sin título", contenido: "" });
  }

  function handleUpdateNote(notaId, cambios) {
    setActiveNote((prev) => (prev && prev.id === notaId ? { ...prev, ...cambios } : prev));
    updateNote(user.uid, selectedFolderId, notaId, cambios);
  }

  async function handleUploadFile(file) {
    const { url, tipo, nombreArchivo } = await uploadFile(user.uid, selectedFolderId, file);
    await registerAttachment(user.uid, selectedFolderId, { nombreArchivo, tipo, urlStorage: url });
  }

  // Transcribe el audio con Gemini y crea una nota con el texto resultante.
  // No se sube el audio a Firebase Storage (requiere plan Blaze); la transcripción
  // ocurre en memoria y solo se guarda el texto.
  async function handleUploadAudio(file) {
    if (!selectedFolderId) return;
    setTranscribeError(null);
    setTranscribing(true);
    try {
      const texto = await transcribirAudio(file);

      const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
      const titulo = `Audio ${fecha}`;
      const ref = await createNote(user.uid, selectedFolderId, titulo);
      await updateNote(user.uid, selectedFolderId, ref.id, { contenido: texto });
      setActiveNote({ id: ref.id, titulo, contenido: texto });
    } catch (err) {
      console.error("Error transcribiendo audio:", err);
      setTranscribeError("No se pudo transcribir el audio. Intenta de nuevo.");
    } finally {
      setTranscribing(false);
    }
  }

  async function handleSendMessage(texto) {
    setSending(true);
    try {
      await addChatMessage(user.uid, selectedFolderId, { remitente: "usuario", texto, contextoAnclado: context?.nombre || null });
      // Nota: para adjuntos PDF/audio, aquí conviene extraer el texto real (o pasar la imagen
      // directamente a Gemini, que sí puede leer imágenes) antes de mandarlo como contextoTexto.
      // Para notas, el contenido ya es texto plano, así que va directo.
      const respuesta = await preguntarIA({
        pregunta: texto,
        contextoTexto: context?.tipo === "nota" ? context.texto : null,
        historial: messages.map((m) => ({ remitente: m.remitente, texto: m.texto })),
      });
      await addChatMessage(user.uid, selectedFolderId, { remitente: "ia", texto: respuesta });
    } catch (err) {
      await addChatMessage(user.uid, selectedFolderId, {
        remitente: "ia",
        texto: "No pude responder en este momento. Intenta de nuevo en unos segundos.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex text-text-primary">
      <Sidebar
        folders={folders}
        selectedId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        user={user}
        onLogout={logout}
      />
      <NotesPanel
        folderName={selectedFolder?.nombre}
        notes={notes}
        attachments={attachments}
        activeNote={activeNote}
        onCreateNote={handleCreateNote}
        onSelectNote={setActiveNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={(id) => { deleteNote(user.uid, selectedFolderId, id); setActiveNote(null); }}
        onUploadFile={handleUploadFile}
        onUploadAudio={handleUploadAudio}
        transcribing={transcribing}
        transcribeError={transcribeError}
        onDeleteAttachment={(id) => deleteAttachment(user.uid, selectedFolderId, id)}
        onUseAsContext={setContext}
      />
      <ChatPanel
        messages={messages}
        context={context}
        onClearContext={() => setContext(null)}
        onSend={handleSendMessage}
        sending={sending}
      />
    </div>
  );
}
