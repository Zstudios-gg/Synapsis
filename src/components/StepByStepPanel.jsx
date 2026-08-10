import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, ChevronLeft, ChevronRight, Sparkles, Save, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { generarPasos } from "../lib/gemini";
import { montarGeoGebra, correrComandos, limpiarGeoGebra } from "../lib/geogebra";
import { savePasoAPaso } from "../lib/firestore";

const GGB_CONTAINER_ID = "ggb-paso-a-paso";

// Resumen corto para mostrar en el historial y guardar junto con los pasos.
function resumirOrigen(origen) {
  if (!origen) return "Ejercicio";
  if (origen.tipo === "texto") return origen.valor.slice(0, 80);
  if (origen.tipo === "adjunto") return origen.adjunto?.nombreArchivo || "Adjunto";
  if (origen.tipo === "quiz") return origen.pregunta?.slice(0, 80) || "Pregunta de quiz";
  return "Ejercicio";
}

// origen:
//   { tipo: "texto", valor }                                        → nota, selección, o ejercicio escrito
//   { tipo: "adjunto", adjunto }                                    → objeto de Firestore con urlStorage
//   { tipo: "quiz", pregunta, respuestaUsuario, respuestaCorrecta } → pregunta fallida del quiz
//   null                                                             → muestra un textarea para que el usuario escriba el ejercicio
//
// pasosGuardados: si viene con un arreglo de pasos ya generado (desde el
// historial), el panel se abre directo en modo lectura, sin llamar a
// Gemini y sin mostrar el botón de guardar (ya está guardado).
export default function StepByStepPanel({ uid, carpetaId, origen: origenInicial, pasosGuardados = null, onClose }) {
  // fase: "capturar" | "cargando" | "elegir" | "pasos" | "error"
  const [fase, setFase] = useState(pasosGuardados ? "pasos" : origenInicial ? "cargando" : "capturar");
  const [error, setError] = useState(null);
  const [textoLibre, setTextoLibre] = useState("");
  const [opciones, setOpciones] = useState([]);
  const [pasos, setPasos] = useState(pasosGuardados || []);
  const [indice, setIndice] = useState(0);
  const [usaGeoGebra, setUsaGeoGebra] = useState(
    pasosGuardados ? pasosGuardados.some((p) => p.geogebra?.length > 0) : false
  );
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const origenRef = useRef(origenInicial);
  const ggbRef = useRef(null);

  async function handleGuardar() {
    if (!uid || !carpetaId || guardando || guardado) return;
    setGuardando(true);
    try {
      await savePasoAPaso(uid, carpetaId, { resumen: resumirOrigen(origenRef.current), pasos });
      setGuardado(true);
    } catch (err) {
      console.error("No se pudo guardar el paso a paso:", err);
    } finally {
      setGuardando(false);
    }
  }

  async function pedirPasos(opcionElegida = null) {
    setError(null);
    setFase("cargando");
    try {
      const respuesta = await generarPasos(origenRef.current, opcionElegida);

      if (respuesta.tipo === "elegir_ejercicio") {
        setOpciones(respuesta.opciones || []);
        setFase("elegir");
        return;
      }

      const pasosGenerados = respuesta.pasos || [];
      if (pasosGenerados.length === 0) throw new Error("La IA no generó pasos.");

      setUsaGeoGebra(pasosGenerados.some((p) => p.geogebra?.length > 0));
      setPasos(pasosGenerados);
      setIndice(0);
      ggbRef.current = null;
      setFase("pasos");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo generar el paso a paso.");
      setFase("error");
    }
  }

  useEffect(() => {
    if (origenInicial) pedirPasos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monta GeoGebra solo si algún paso lo necesita — nunca aparece vacío
  // en ejercicios no gráficos.
  useEffect(() => {
    if (fase === "pasos" && usaGeoGebra && !ggbRef.current) {
      montarGeoGebra(GGB_CONTAINER_ID).then((api) => {
        ggbRef.current = api;
        correrComandos(api, pasos[0]?.geogebra || []);
      });
    }
  }, [fase, usaGeoGebra, pasos]);

  function handleCapturar() {
    const valor = textoLibre.trim();
    if (!valor) return;
    origenRef.current = { tipo: "texto", valor };
    pedirPasos();
  }

  function siguientePaso() {
    const proximo = indice + 1;
    if (proximo >= pasos.length) return;
    setIndice(proximo);
    if (ggbRef.current) correrComandos(ggbRef.current, pasos[proximo].geogebra || []);
  }

  function anteriorPaso() {
    const previo = indice - 1;
    if (previo < 0) return;
    // GeoGebra no tiene "deshacer un paso" individual, así que la forma
    // simple y confiable es limpiar y re-correr los comandos acumulados.
    if (ggbRef.current) {
      limpiarGeoGebra(ggbRef.current);
      for (let i = 0; i <= previo; i++) correrComandos(ggbRef.current, pasos[i].geogebra || []);
    }
    setIndice(previo);
  }

  const pasoActual = pasos[indice];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 sm:px-6 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">Paso a paso</span>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>

        {fase === "capturar" && (
          <div className="flex-1 flex flex-col gap-3">
            <p className="text-xs text-text-muted">Escribe o pega el ejercicio que quieres entender.</p>
            <textarea
              value={textoLibre}
              onChange={(e) => setTextoLibre(e.target.value)}
              placeholder="Ej: Deriva f(x) = x^2 + 3x..."
              rows={5}
              className="w-full bg-card border border-border rounded-xl p-3 text-sm text-text-secondary placeholder-text-muted outline-none resize-none focus:border-accent-soft"
            />
            <button
              onClick={handleCapturar}
              disabled={!textoLibre.trim()}
              className="flex items-center justify-center gap-2 w-full bg-accent-strong text-text-primary text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Explicar paso a paso
            </button>
          </div>
        )}

        {fase === "cargando" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 size={22} className="text-accent animate-spin" />
            <p className="text-sm text-text-secondary">Generando explicación...</p>
          </div>
        )}

        {fase === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-sm text-danger text-center px-4">{error}</p>
            <button onClick={() => pedirPasos()} className="text-sm text-accent hover:text-text-primary">
              Reintentar
            </button>
          </div>
        )}

        {fase === "elegir" && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary mb-1">¿Cuál ejercicio quieres que te explique?</p>
            {opciones.map((op, i) => (
              <button
                key={i}
                onClick={() => pedirPasos(op)}
                className="text-left text-sm px-3.5 py-2.5 rounded-xl border bg-card border-border text-text-secondary hover:border-accent-soft transition-colors"
              >
                {op}
              </button>
            ))}
          </div>
        )}

        {fase === "pasos" && pasoActual && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs text-text-muted">
                Paso {indice + 1} de {pasos.length}
              </span>
              {!pasosGuardados && uid && carpetaId && (
                <button
                  onClick={handleGuardar}
                  disabled={guardando || guardado}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-text-primary disabled:opacity-60 disabled:cursor-default"
                >
                  {guardado ? (
                    <>
                      <Check size={13} /> Guardado
                    </>
                  ) : guardando ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={13} /> Guardar
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="w-full h-1 bg-card rounded-full mb-4 shrink-0 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((indice + 1) / pasos.length) * 100}%` }}
              />
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col gap-3">
              {usaGeoGebra && (
                <div
                  id={GGB_CONTAINER_ID}
                  className="w-full rounded-xl border border-border overflow-hidden"
                  style={{ minHeight: 340 }}
                />
              )}

              <div className="text-sm text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:text-text-primary prose-strong:text-text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {pasoActual.texto}
                </ReactMarkdown>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border shrink-0">
              <button
                onClick={anteriorPaso}
                disabled={indice === 0}
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} /> Anterior
              </button>
              <button
                onClick={siguientePaso}
                disabled={indice === pasos.length - 1}
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Siguiente <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
