import React, { useState } from "react";
import { Sparkles, Send, X, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function ChatPanel({ messages, context, onClearContext, onSend, sending, mobileVisible = true, onBack }) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div
      className={`${mobileVisible ? "flex" : "hidden"} md:flex flex-1 flex-col p-4 sm:p-5 min-w-0 h-full min-h-0`}
    >
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} aria-label="Volver a notas" className="md:hidden -ml-1 mr-0.5 p-1 text-text-secondary hover:text-accent">
          <ArrowLeft size={15} />
        </button>
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

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">
            Pregunta lo que quieras. Si anclas una nota o adjunto desde el panel izquierdo, la IA la usará como contexto.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] sm:max-w-[80%] ${m.remitente === "usuario" ? "self-end" : "self-start"}`}>
            <div
              className={`text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed break-words prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-text-primary prose-strong:text-text-primary prose-code:text-accent prose-code:bg-bg/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg/60 prose-pre:border prose-pre:border-border prose-a:text-accent ${
                m.remitente === "usuario"
                  ? "bg-accent-soft text-text-primary"
                  : "bg-card border border-border text-text-secondary"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {m.texto}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-text-muted">La IA está pensando...</p>}
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 mt-4 shrink-0">
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
