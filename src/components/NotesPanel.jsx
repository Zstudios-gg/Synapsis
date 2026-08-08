import React, { useRef, useState } from "react";
import { Plus, FileText, Paperclip, Trash2, ChevronRight } from "lucide-react";

export default function NotesPanel({
  folderName, notes, attachments, activeNote,
  onCreateNote, onSelectNote, onUpdateNote, onDeleteNote,
  onUploadFile, onDeleteAttachment, onUseAsContext,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUploadFile(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="w-[340px] border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-1.5 text-text-muted text-xs mb-3">
          <span>{folderName || "Selecciona una materia"}</span>
        </div>
        <button
          onClick={onCreateNote}
          disabled={!folderName}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={13} /> Nueva nota
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelectNote(n)}
            className={`w-full text-left flex items-center gap-2 px-4 py-3 border-b border-border/50 transition-colors ${
              activeNote?.id === n.id ? "bg-card" : "hover:bg-card/60"
            }`}
          >
            <FileText size={13} className="text-text-muted shrink-0" />
            <span className="text-sm text-text-secondary truncate flex-1">{n.titulo}</span>
            <ChevronRight size={13} className="text-text-muted shrink-0" />
          </button>
        ))}
      </div>

      {activeNote && (
        <div className="border-t border-border p-4 flex flex-col" style={{ maxHeight: "45%" }}>
          <div className="flex items-center justify-between mb-2">
            <input
              value={activeNote.titulo}
              onChange={(e) => onUpdateNote(activeNote.id, { titulo: e.target.value })}
              className="bg-transparent text-sm font-medium text-text-primary outline-none flex-1"
            />
            <button onClick={() => onDeleteNote(activeNote.id)} aria-label="Eliminar nota">
              <Trash2 size={13} className="text-text-muted hover:text-danger" />
            </button>
          </div>
          <textarea
            value={activeNote.contenido}
            onChange={(e) => onUpdateNote(activeNote.id, { contenido: e.target.value })}
            placeholder="Escribe aquí..."
            className="flex-1 bg-card border border-border rounded-lg p-2.5 text-sm text-text-secondary placeholder-text-muted outline-none resize-none focus:border-accent-soft"
          />
          <button
            onClick={() => onUseAsContext({ tipo: "nota", texto: activeNote.contenido, nombre: activeNote.titulo })}
            className="mt-2 text-xs text-accent hover:text-text-primary text-left"
          >
            Usar esta nota como contexto en el chat →
          </button>
        </div>
      )}

      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-text-muted">Adjuntos</span>
          <button onClick={() => fileInputRef.current?.click()} disabled={!folderName} aria-label="Subir archivo">
            <Plus size={13} className="text-text-muted hover:text-accent" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*,audio/*" />
        </div>
        {uploading && <p className="text-xs text-text-muted">Subiendo...</p>}
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-card border border-border rounded-md px-2 py-1.5">
              <Paperclip size={12} className="text-text-muted shrink-0" />
              <span className="text-xs text-text-secondary truncate flex-1">{a.nombreArchivo}</span>
              <button
                onClick={() => onUseAsContext({ tipo: "adjunto", texto: a.urlStorage, nombre: a.nombreArchivo })}
                className="text-[10px] text-accent hover:text-text-primary shrink-0"
              >
                usar
              </button>
              <button onClick={() => onDeleteAttachment(a.id)} aria-label="Eliminar adjunto">
                <Trash2 size={11} className="text-text-muted hover:text-danger shrink-0" />
              </button>
            </div>
          ))}
          {attachments.length === 0 && <p className="text-xs text-text-muted">Sin adjuntos aún.</p>}
        </div>
      </div>
    </div>
  );
}
