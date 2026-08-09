// Wrapper mínimo sobre el GeoGebra Apps API. Carga el script una sola vez
// y expone helpers para montar el applet y correr comandos paso a paso.
// No requiere instalar nada por npm (se carga por <script> en runtime).

const GGB_SCRIPT_URL = "https://www.geogebra.org/apps/deployggb.js";

let scriptPromise = null;

function loadGeoGebraScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.GGBApplet) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GGB_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar GeoGebra"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Monta un applet de GeoGebra dentro del elemento con el id dado.
 * Devuelve el objeto ggbApplet ya listo para recibir comandos.
 *
 * appName: "graphing" = vista de gráficos + álgebra, cubre funciones,
 * geometría y cálculo, que es el grueso de lo que pedirá el paso a paso.
 */
export async function montarGeoGebra(containerId, { width = 600, height = 340 } = {}) {
  await loadGeoGebraScript();

  return new Promise((resolve) => {
    const params = {
      appName: "graphing",
      width,
      height,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      showResetIcon: true,
      enableRightClick: false,
      language: "es",
      appletOnLoad: (api) => resolve(api),
    };
    const applet = new window.GGBApplet(params, true);
    applet.inject(containerId);
  });
}

/**
 * Ejecuta una lista de comandos GeoGebra en orden sobre un applet ya
 * montado. Si un comando falla (sintaxis rara que devolvió Gemini), lo
 * salta sin tumbar los demás pasos.
 */
export function correrComandos(ggbApplet, comandos = []) {
  comandos.forEach((cmd) => {
    try {
      ggbApplet.evalCommand(cmd);
    } catch (err) {
      console.warn("Comando GeoGebra inválido, se omite:", cmd, err);
    }
  });
}

/** Limpia el lienzo. Se usa al retroceder pasos. */
export function limpiarGeoGebra(ggbApplet) {
  if (ggbApplet?.reset) ggbApplet.reset();
}
