import React, { useEffect, useState } from "react";
import { X, ListChecks, Lightbulb, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { watchQuizHistory, watchPasosHistory, deleteQuizResult, deletePasoAPaso } from "../lib/firestore";

function formatearFecha(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Historial de quizzes y paso a paso guardados de una materia (Sección 10.1
// del documento de diseño). "onAbrirPasos" reabre un paso a paso guardado
// en modo lectura, reutilizando StepByStepPanel desde NotesPanel.
export default function HistorialModal({ uid, carpetaId, folderName, onAbrirPasos, onClose }) {
  const [tab, setTab] = useState("quizzes"); // "quizzes" | "pasos"
  const [quizzes, setQuizzes] = useState([]);
  const [pasos, setPasos] = useState([]);
  const [quizAbierto, setQuizAbierto] = useState(null);

  useEffect(() => {
    if (!uid || !carpetaId) return;
    const unsubQ = watchQuizHistory(uid, carpetaId, setQuizzes);
    const unsubP = watchPasosHistory(uid, carpetaId, setPasos);
    return () => {
      unsubQ();
      unsubP();
    };
  }, [uid, carpetaId]);

  function handleEliminarQuiz(id) {
    deleteQuizResult(uid, carpetaId, id).catch((err) => console.error(err));
    if (quizAbierto?.id === id) setQuizAbierto(null);
  }

  function handleEliminarPaso(id) {
    deletePasoAPaso(uid, carpetaId, id).catch((err) => console.error(err));
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 sm:px-6 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-sm font-medium text-text-primary">Historial · {folderName}</span>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 shrink-0">
          <button
            onClick={() => setTab("quizzes")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              tab === "quizzes"
                ? "bg-accent-soft border-accent text-text-primary"
                : "bg-card border-border text-text-secondary hover:border-accent-soft"
            }`}
          >
            <ListChecks size={13} /> Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setTab("pasos")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              tab === "pasos"
                ? "bg-accent-soft border-accent text-text-primary"
                : "bg-card border-border text-text-secondary hover:border-accent-soft"
            }`}
          >
            <Lightbulb size={13} /> Paso a paso ({pasos.length})
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col gap-2">
          {tab === "quizzes" && (
            <>
              {quizzes.length === 0 && (
                <p className="text-xs text-text-muted text-center py-6">Todavía no has completado ningún quiz aquí.</p>
              )}
              {quizzes.map((q) => (
                <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <button
                      onClick={() => setQuizAbierto(quizAbierto?.id === q.id ? null : q)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm text-text-primary">
                        {q.correctas}/{q.cantidadPreguntas} · {q.puntajeTotal}%
                      </p>
                      <p className="text-[11px] text-text-muted">{formatearFecha(q.fecha)}</p>
                    </button>
                    <button onClick={() => handleEliminarQuiz(q.id)} aria-label="Eliminar quiz">
                      <Trash2 size={13} className="text-text-muted hover:text-danger" />
                    </button>
                  </div>

                  {quizAbierto?.id === q.id && (
                    <div className="border-t border-border px-3.5 py-2.5 flex flex-col gap-2">
                      {(q.detalle || []).map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {d.ok ? (
                            <CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={13} className="text-danger shrink-0 mt-0.5" />
                          )}
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {i + 1}. {d.pregunta}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {tab === "pasos" && (
            <>
              {pasos.length === 0 && (
                <p className="text-xs text-text-muted text-center py-6">
                  Todavía no has guardado ningún paso a paso aquí.
                </p>
              )}
              {pasos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-3.5 py-2.5"
                >
                  <button onClick={() => onAbrirPasos(p)} className="flex-1 text-left">
                    <p className="text-sm text-text-primary truncate">{p.resumen}</p>
                    <p className="text-[11px] text-text-muted">
                      {p.pasos?.length || 0} pasos · {formatearFecha(p.fecha)}
                    </p>
                  </button>
                  <button onClick={() => handleEliminarPaso(p.id)} aria-label="Eliminar paso a paso">
                    <Trash2 size={13} className="text-text-muted hover:text-danger" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
