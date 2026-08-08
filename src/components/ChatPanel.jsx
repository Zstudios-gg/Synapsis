import React, { useState } from "react";
import { Sparkles, Send, X } from "lucide-react";

export default function ChatPanel({ messages, context, onClearContext, onSend, sending }) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="flex-1 flex flex-col p-5 min-w-0">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={14} className="text-accent" />
        <span className="text-sm font-medium text-text-primary">Chat con contexto</span>
        {context && (
          <div className="flex items-center gap-1 bg-accent-soft text-accent text-[10px] px-2 py-0.5 rounded-full ml-auto">
            <span className="max-w-[140px] truncate">{context.nombre}</span>
            <button onClick={onClearContext} aria-label="Quitar contexto">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">
            Pregunta lo que quieras. Si anclas una nota o adjunto desde el panel izquierdo, la IA la usará como contexto.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] ${m.remitente === "usuario" ? "self-end" : "self-start"}`}>
            <div
              className={`text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.remitente === "usuario"
                  ? "bg-accent-soft text-text-primary"
                  : "bg-card border border-border text-text-secondary"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-text-muted">La IA está pensando...</p>}
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 mt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Pregúntale a la IA sobre esta materia..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-strong disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send size={13} className="text-text-primary" />
        </button>
      </div>
    </div>
  );
}
