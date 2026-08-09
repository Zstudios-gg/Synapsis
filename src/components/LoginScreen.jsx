import React, { useState } from "react";
import { Sparkles, Info, X, ShieldCheck, ExternalLink } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 relative">
      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4">
        <Sparkles size={20} className="text-accent" />
      </div>
      <h1 className="text-2xl font-semibold text-text-primary mb-1">Synapsis</h1>
      <p className="text-sm text-text-secondary mb-8 text-center max-w-xs">
        Tus notas, adjuntos y una IA con contexto de todo, en un solo lugar.
      </p>
      <button
        onClick={onLogin}
        className="flex items-center gap-2 bg-card border border-border hover:border-accent-soft text-text-primary text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
          <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.39-2.28V6.62H1.29A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38l3.98-3.1z"/>
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75z"/>
        </svg>
        Continuar con Google
      </button>

      <button
        onClick={() => setShowInfo(true)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent mt-4"
      >
        <Info size={13} />
        ¿Cómo funciona el inicio de sesión?
      </button>

      <a
        href="https://zstudios-gg.github.io/Info-Proyects/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent absolute bottom-6"
      >
        Un proyecto de ZStudios
        <ExternalLink size={11} />
      </a>

      {showInfo && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent" />
                <span className="text-sm font-medium text-text-primary">Inicio de sesión seguro</span>
              </div>
              <button onClick={() => setShowInfo(false)} aria-label="Cerrar">
                <X size={16} className="text-text-muted hover:text-text-primary" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                Synapsis usa <span className="text-text-primary font-medium">Firebase Authentication</span>,
                el servicio oficial de Google para iniciar sesión de forma segura. Nunca vemos ni guardamos tu
                contraseña de Google.
              </p>
              <p>
                Solo se solicita tu nombre, correo y foto de perfil para identificar tu cuenta. Tus notas y
                adjuntos se guardan en tu propia base de datos privada (Firestore), separada de cualquier
                otro usuario.
              </p>
              <p>
                Puedes revocar el acceso cuando quieras desde tu cuenta de Google, en{" "}
                <span className="text-text-primary">myaccount.google.com/permissions</span>.
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-5 w-full bg-accent-strong text-text-primary text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
