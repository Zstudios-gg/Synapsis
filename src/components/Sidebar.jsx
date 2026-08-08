import React, { useState } from "react";
import { Sparkles, Plus, Folder, Search, LogOut } from "lucide-react";

export default function Sidebar({ folders, selectedId, onSelect, onCreateFolder, user, onLogout }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onCreateFolder(trimmed);
    setName("");
    setCreating(false);
  }

  return (
    <div className="w-56 bg-surface border-r border-border flex flex-col p-4 shrink-0">
      <div className="flex items-center gap-2 mb-6 px-1">
        <div className="w-[26px] h-[26px] rounded-md bg-accent-soft flex items-center justify-center">
          <Sparkles size={13} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">Synapsis</span>
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2.5 py-2 mb-5">
        <Search size={13} className="text-text-muted" />
        <span className="text-xs text-text-muted">Buscar</span>
      </div>

      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] uppercase tracking-wider text-text-muted">Materias</span>
        <button onClick={() => setCreating(true)} aria-label="Nueva carpeta">
          <Plus size={13} className="text-text-muted hover:text-accent" />
        </button>
      </div>

      {creating && (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onBlur={submit}
          placeholder="Nombre de la materia"
          className="mb-2 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
        />
      )}

      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
              f.id === selectedId ? "bg-accent-soft text-text-primary" : "text-text-secondary hover:bg-card"
            }`}
          >
            <Folder size={14} className={f.id === selectedId ? "text-accent" : "text-text-muted"} />
            <span className="flex-1 truncate">{f.nombre}</span>
          </button>
        ))}
        {folders.length === 0 && !creating && (
          <p className="text-xs text-text-muted px-2 py-3">Crea tu primera materia con el +.</p>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span className="text-xs text-text-secondary truncate flex-1">{user.displayName}</span>
          <button onClick={onLogout} aria-label="Cerrar sesión">
            <LogOut size={13} className="text-text-muted hover:text-danger" />
          </button>
        </div>
      )}
    </div>
  );
}
