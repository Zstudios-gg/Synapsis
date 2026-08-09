import React, { useState } from "react";
import { Sparkles, Plus, Folder, Search, LogOut, Pencil, Check } from "lucide-react";
import ProfileModal from "./ProfileModal";

export default function Sidebar({ folders, selectedId, onSelect, onCreateFolder, onRenameFolder, user, onLogout, mobileVisible = true }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onCreateFolder(trimmed);
    setName("");
    setCreating(false);
  }

  function startRename(folder) {
    setRenamingId(folder.id);
    setRenameValue(folder.nombre);
  }

  function confirmRename() {
    const trimmed = renameValue.trim();
    if (trimmed && renamingId) onRenameFolder(renamingId, trimmed);
    setRenamingId(null);
    setRenameValue("");
  }

  return (
    <div
      className={`${mobileVisible ? "flex" : "hidden"} md:flex w-full md:w-56 h-full min-h-0 bg-surface border-r border-border flex-col p-4 md:shrink-0 overflow-hidden`}
    >
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
        {folders.map((f) =>
          renamingId === f.id ? (
            <div key={f.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-card">
              <Folder size={14} className="text-accent shrink-0" />
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onBlur={confirmRename}
                className="flex-1 min-w-0 bg-transparent text-sm text-text-primary outline-none"
              />
              <button onMouseDown={(e) => e.preventDefault()} onClick={confirmRename} aria-label="Confirmar nombre">
                <Check size={13} className="text-accent shrink-0" />
              </button>
            </div>
          ) : (
            <div
              key={f.id}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                f.id === selectedId ? "bg-accent-soft text-text-primary" : "text-text-secondary hover:bg-card"
              }`}
            >
              <button onClick={() => onSelect(f.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <Folder size={14} className={f.id === selectedId ? "text-accent" : "text-text-muted"} />
                <span className="flex-1 truncate">{f.nombre}</span>
              </button>
              <button
                onClick={() => startRename(f)}
                aria-label="Renombrar materia"
                className="shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-60 hover:!opacity-100"
              >
                <Pencil size={12} className="text-text-muted hover:text-accent" />
              </button>
            </div>
          )
        )}
        {folders.length === 0 && !creating && (
          <p className="text-xs text-text-muted px-2 py-3">Crea tu primera materia con el +.</p>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg hover:bg-card p-1 -m-1 transition-colors"
          >
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full shrink-0" referrerPolicy="no-referrer" />
            )}
            <span className="text-xs text-text-secondary truncate flex-1">{user.displayName}</span>
          </button>
          <button onClick={onLogout} aria-label="Cerrar sesión">
            <LogOut size={13} className="text-text-muted hover:text-danger" />
          </button>
        </div>
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} />
      )}
    </div>
  );
}
