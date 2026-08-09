import React, { useState } from "react";
import { X, LogOut, Check, Palette, ExternalLink } from "lucide-react";
import { THEMES, getStoredThemeId, applyTheme } from "../lib/themes";

export default function ProfileModal({ user, onClose, onLogout }) {
  const [selectedTheme, setSelectedTheme] = useState(getStoredThemeId());

  function handlePick(themeId) {
    setSelectedTheme(themeId);
    applyTheme(themeId);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-medium text-text-primary">Tu perfil</span>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Palette size={13} className="text-accent" />
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Color de acento</span>
          </div>
          <div className="grid grid-cols-6 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handlePick(t.id)}
                aria-label={t.nombre}
                title={t.nombre}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: t.accent }}
              >
                {selectedTheme === t.id && <Check size={14} className="text-bg" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full bg-card border border-border hover:border-danger/50 text-text-secondary hover:text-danger text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>

        <a
          href="https://zstudios-gg.github.io/Info-Proyects"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-accent mt-4"
        >
          Un proyecto de ZStudios
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
