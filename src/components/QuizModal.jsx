import React, { useMemo, useState } from "react";
import {
  X, Sparkles, FileText, Paperclip, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, RotateCcw, ListChecks,
} from "lucide-react";
import { generarQuiz, evaluarRespuestasAbiertas } from "../lib/gemini";
import StepByStepPanel from "./StepByStepPanel";

const CANTIDADES = [5, 8, 12];

export default function QuizModal({ folderName, notes, attachments, onClose }) {
  // fase: "setup" | "generando" | "tomando" | "calificando" | "resultados"
  const [fase, setFase] = useState("setup");
  const [error, setError] = useState(null);

  const [notasSeleccionadas, setNotasSeleccionadas] = useState(() => new Set());
  const [adjuntosSeleccionados, setAdjuntosSeleccionados] = useState(() => new Set());
  const [cantidad, setCantidad] = useState(8);

  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState({}); // { [preguntaId]: valor }
  const [resultados, setResultados] = useState(null); // { total, correctas, detalle: [...] }
  const [stepsOrigen, setStepsOrigen] = useState(null);
  const [showSteps, setShowSteps] = useState(false);

  function verPasoAPaso(d) {
    const respuestaUsuario =
      d.pregunta.tipo === "opcion_multiple"
        ? d.pregunta.opciones[d.elegida] ?? "(sin responder)"
        : d.respuestaUsuario || "(sin responder)";
    const respuestaCorrecta =
      d.pregunta.tipo === "opcion_multiple"
        ? d.pregunta.opciones[d.pregunta.respuestaCorrecta]
        : d.pregunta.respuestaModelo;

    setStepsOrigen({
      tipo: "quiz",
      pregunta: d.pregunta.pregunta,
      respuestaUsuario,
      respuestaCorrecta,
    });
    setShowSteps(true);
  }

  const seleccionVacia = notasSeleccionadas.size === 0 && adjuntosSeleccionados.size === 0;

  function toggleNota(id) {
    setNotasSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAdjunto(id) {
    setAdjuntosSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleGenerar() {
    setError(null);
    setFase("generando");
    try {
      const notasElegidas = notes.filter((n) => notasSeleccionadas.has(n.id));
      const adjuntosElegidos = attachments.filter((a) => adjuntosSeleccionados.has(a.id));
      const qs = await generarQuiz({ notas: notasElegidas, adjuntos: adjuntosElegidos, cantidad });
      setPreguntas(qs);
      setIndice(0);
      setRespuestas({});
      setFase("tomando");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo generar el quiz.");
      setFase("setup");
    }
  }

  function responder(preguntaId, valor) {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
  }

  async function handleTerminar() {
    setFase("calificando");
    setError(null);
    try {
      const abiertas = preguntas.filter((p) => p.tipo === "abierta");
      const evalItems = abiertas.map((p) => ({
        pregunta: p.pregunta,
        respuestaModelo: p.respuestaModelo,
        respuestaUsuario: respuestas[p.id] || "",
      }));
      const evaluaciones = await evaluarRespuestasAbiertas(evalItems);

      let correctas = 0;
      const detalle = preguntas.map((p) => {
        if (p.tipo === "opcion_multiple") {
          const elegida = respuestas[p.id];
          const ok = elegida === p.respuestaCorrecta;
          if (ok) correctas++;
          return { pregunta: p, ok, elegida };
        } else {
          const i = abiertas.findIndex((a) => a.id === p.id);
          const ev = evaluaciones[i] || { puntaje: 0, correcta: false, feedback: "" };
          if (ev.correcta) correctas++;
          return { pregunta: p, ok: ev.correcta, feedback: ev.feedback, puntaje: ev.puntaje, respuestaUsuario: respuestas[p.id] || "" };
        }
      });

      setResultados({ total: preguntas.length, correctas, detalle });
      setFase("resultados");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudieron calificar las respuestas.");
      setFase("tomando");
    }
  }

  function handleReintentar() {
    setRespuestas({});
    setIndice(0);
    setResultados(null);
    setFase("tomando");
  }

  const preguntaActual = preguntas[indice];
  const respondidas = useMemo(
    () => preguntas.filter((p) => respuestas[p.id] !== undefined && respuestas[p.id] !== "").length,
    [preguntas, respuestas]
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 sm:px-6 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">Quiz · {folderName}</span>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mb-4 shrink-0">
            {error}
          </p>
        )}

        {fase === "setup" && (
          <div className="overflow-y-auto flex-1 flex flex-col gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Notas</p>
              {notes.length === 0 && <p className="text-xs text-text-muted">No hay notas en esta materia.</p>}
              <div className="flex flex-col gap-1.5">
                {notes.map((n) => (
                  <label
                    key={n.id}
                    className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-accent-soft"
                  >
                    <input
                      type="checkbox"
                      checked={notasSeleccionadas.has(n.id)}
                      onChange={() => toggleNota(n.id)}
                      className="accent-accent"
                    />
                    <FileText size={13} className="text-text-muted shrink-0" />
                    <span className="text-sm text-text-secondary truncate">{n.titulo}</span>
                  </label>
                ))}
              </div>
            </div>

            {attachments.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Adjuntos</p>
                <div className="flex flex-col gap-1.5">
                  {attachments.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-accent-soft"
                    >
                      <input
                        type="checkbox"
                        checked={adjuntosSeleccionados.has(a.id)}
                        onChange={() => toggleAdjunto(a.id)}
                        className="accent-accent"
                      />
                      <Paperclip size={13} className="text-text-muted shrink-0" />
                      <span className="text-sm text-text-secondary truncate">{a.nombreArchivo}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Número de preguntas</p>
              <div className="flex gap-2">
                {CANTIDADES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCantidad(c)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm border transition-colors ${
                      cantidad === c
                        ? "bg-accent-soft border-accent text-text-primary"
                        : "bg-card border-border text-text-secondary hover:border-accent-soft"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerar}
              disabled={seleccionVacia}
              className="mt-auto flex items-center justify-center gap-2 w-full bg-accent-strong text-text-primary text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ListChecks size={15} />
              Generar quiz
            </button>
          </div>
        )}

        {fase === "generando" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 size={22} className="text-accent animate-spin" />
            <p className="text-sm text-text-secondary">Generando preguntas a partir de tu material...</p>
          </div>
        )}

        {fase === "tomando" && preguntaActual && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs text-text-muted">
                Pregunta {indice + 1} de {preguntas.length} · {respondidas} respondidas
              </span>
              <span className="text-[10px] uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                {preguntaActual.tema}
              </span>
            </div>

            <div className="w-full h-1 bg-card rounded-full mb-4 shrink-0 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((indice + 1) / preguntas.length) * 100}%` }}
              />
            </div>

            <div className="overflow-y-auto flex-1">
              <p className="text-sm sm:text-base text-text-primary font-medium mb-4 leading-relaxed">
                {preguntaActual.pregunta}
              </p>

              {preguntaActual.tipo === "opcion_multiple" ? (
                <div className="flex flex-col gap-2">
                  {(preguntaActual.opciones || []).map((op, i) => (
                    <button
                      key={i}
                      onClick={() => responder(preguntaActual.id, i)}
                      className={`text-left text-sm px-3.5 py-2.5 rounded-xl border transition-colors ${
                        respuestas[preguntaActual.id] === i
                          ? "bg-accent-soft border-accent text-text-primary"
                          : "bg-card border-border text-text-secondary hover:border-accent-soft"
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={respuestas[preguntaActual.id] || ""}
                  onChange={(e) => responder(preguntaActual.id, e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={5}
                  className="w-full bg-card border border-border rounded-xl p-3 text-sm text-text-secondary placeholder-text-muted outline-none resize-none focus:border-accent-soft"
                />
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border shrink-0">
              <button
                onClick={() => setIndice((i) => Math.max(0, i - 1))}
                disabled={indice === 0}
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} /> Anterior
              </button>

              {indice === preguntas.length - 1 ? (
                <button
                  onClick={handleTerminar}
                  className="bg-accent-strong text-text-primary text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Terminar quiz
                </button>
              ) : (
                <button
                  onClick={() => setIndice((i) => Math.min(preguntas.length - 1, i + 1))}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent"
                >
                  Siguiente <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {fase === "calificando" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 size={22} className="text-accent animate-spin" />
            <p className="text-sm text-text-secondary">Calificando tus respuestas...</p>
          </div>
        )}

        {fase === "resultados" && resultados && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-center mb-4 shrink-0">
              <p className="text-3xl font-semibold text-text-primary">
                {resultados.correctas}/{resultados.total}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {Math.round((resultados.correctas / resultados.total) * 100)}% correcto
              </p>
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col gap-3">
              {resultados.detalle.map((d, i) => (
                <div key={d.pregunta.id} className="bg-card border border-border rounded-xl p-3.5">
                  <div className="flex items-start gap-2 mb-2">
                    {d.ok ? (
                      <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={15} className="text-danger shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-text-primary leading-relaxed">
                      {i + 1}. {d.pregunta.pregunta}
                    </p>
                  </div>

                  {d.pregunta.tipo === "opcion_multiple" ? (
                    <div className="pl-6 text-xs text-text-secondary space-y-0.5">
                      <p>
                        Tu respuesta: <span className={d.ok ? "text-success" : "text-danger"}>
                          {d.pregunta.opciones[d.elegida] ?? "(sin responder)"}
                        </span>
                      </p>
                      {!d.ok && (
                        <p>Correcta: <span className="text-success">{d.pregunta.opciones[d.pregunta.respuestaCorrecta]}</span></p>
                      )}
                    </div>
                  ) : (
                    <div className="pl-6 text-xs text-text-secondary space-y-1">
                      <p>Tu respuesta: {d.respuestaUsuario || "(sin responder)"}</p>
                      <p className="text-text-muted italic">{d.feedback}</p>
                    </div>
                  )}

                  {!d.ok && (
                    <button
                      onClick={() => verPasoAPaso(d)}
                      className="mt-2 ml-6 text-xs text-accent hover:text-text-primary"
                    >
                      Ver paso a paso →
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleReintentar}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-card border border-border hover:border-accent-soft text-text-secondary text-sm font-medium py-2.5 rounded-xl transition-colors shrink-0"
            >
              <RotateCcw size={14} />
              Repetir el mismo quiz
            </button>
          </div>
        )}
      </div>

      {showSteps && <StepByStepPanel origen={stepsOrigen} onClose={() => setShowSteps(false)} />}
    </div>
  );
}