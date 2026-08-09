// Paletas de acento disponibles para personalizar Synapsis.
// Cada una define los 3 tonos que ya usaba el diseño original (accent-soft,
// accent, accent-strong), solo que ahora son variables CSS en vez de valores
// fijos en Tailwind, así se pueden cambiar en caliente sin recompilar.

export const THEMES = [
  { id: "violeta", nombre: "Violeta", soft: "#453770", accent: "#8B7FD4", strong: "#5A4A94" },
  { id: "azul", nombre: "Azul", soft: "#2A3B5C", accent: "#6FA8E0", strong: "#34527A" },
  { id: "verde", nombre: "Verde", soft: "#2E4A3B", accent: "#6FCF97", strong: "#3A6B4F" },
  { id: "rosa", nombre: "Rosa", soft: "#5C2E45", accent: "#E08FB0", strong: "#7A3A57" },
  { id: "naranja", nombre: "Naranja", soft: "#5C3E22", accent: "#E0A15C", strong: "#7A5230" },
  { id: "cian", nombre: "Cian", soft: "#234B4E", accent: "#5CC8D0", strong: "#2E6468" },
];

export const DEFAULT_THEME_ID = "violeta";
const STORAGE_KEY = "synapsis-accent-theme";

export function getStoredThemeId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--accent-soft", theme.soft);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-strong", theme.strong);
  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    // localStorage no disponible (modo privado, etc). No es crítico.
  }
}
