const KEY = "enhTheme";

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme) {
  const root = document.documentElement;

  if (!theme) {
    root.removeAttribute("dataTheme");
    return;
  }

  root.setAttribute("dataTheme", theme);
}

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const theme = saved || "light";
  applyTheme(theme);
}

export function cycleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("dataTheme") || "light";

  const next = current === "light" ? "dark" : current === "dark" ? "high" : "light";
  applyTheme(next);

  localStorage.setItem(KEY, next);
  return next;
}