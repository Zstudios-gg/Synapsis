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
      appletOnLoad: (api) => {
        // El cuadro de error nativo de GeoGebra ("?" rojo dentro del
        // applet) no tiene forma de interceptarse ni de estilizarse, y
        // rompe la experiencia del paso a paso. Lo apagamos y en su
        // lugar detectamos fallos por el valor de retorno de
        // evalCommand (ver correrComandos).
        if (api.setErrorDialogsActive) api.setErrorDialogsActive(false);
        resolve(api);
      },
    };
    const applet = new window.GGBApplet(params, true);
    applet.inject(containerId);
  });
}

// Gemini a veces devuelve comillas tipográficas (' ' " ") en vez de las
// rectas que espera la sintaxis de GeoGebra, típicamente al escribir la
// derivada como f'(x). Eso hace que evalCommand falle silenciosamente
// (devuelve false, no lanza excepción) con un error de "variable" dentro
// del applet. Normalizamos antes de ejecutar.
function normalizarComando(cmd) {
  return cmd.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

/**
 * Ejecuta una lista de comandos GeoGebra en orden sobre un applet ya
 * montado. evalCommand no lanza excepción cuando un comando es inválido:
 * devuelve false. Revisamos ese valor de retorno (y también envolvemos
 * en try/catch por si acaso) para poder ver en consola exactamente qué
 * comando fue el que falló, en vez de que quede en silencio.
 */
export function correrComandos(ggbApplet, comandos = []) {
  comandos.forEach((cmdOriginal) => {
    const cmd = normalizarComando(cmdOriginal);
    try {
      const ok = ggbApplet.evalCommand(cmd);
      if (ok === false) {
        console.warn("Comando GeoGebra inválido, se omite:", cmd);
      }
    } catch (err) {
      console.warn("Comando GeoGebra inválido, se omite:", cmd, err);
    }
  });
}

/** Limpia el lienzo. Se usa al retroceder pasos. */
export function limpiarGeoGebra(ggbApplet) {
  if (ggbApplet?.reset) ggbApplet.reset();
}
