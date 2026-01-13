import { cycleTheme } from "../init/theme.js";

function setActiveLinks() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  const links = document.querySelectorAll(".navLink, .sidebarLink");
  links.forEach((a) => {
    const href = (a.getAttribute("href") || "").replace(/\/$/, "");
    const isActive = href && href !== "#" && href === path;
    a.classList.toggle("isActive", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function openSearch() {
  document.body.classList.add("searchOpen");
  const input = document.getElementById("globalSearch");
  if (input) input.focus();
}

function closeSearch() {
  document.body.classList.remove("searchOpen");
}

function toggleSidebar() {
  const open = document.body.classList.toggle("sidebarOpen");
  const btn = document.getElementById("navToggle");
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

export function initControls() {
  setActiveLinks();

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = cycleTheme();
      themeBtn.setAttribute("aria-pressed", next !== "light" ? "true" : "false");
    });
  }

  const navBtn = document.getElementById("navToggle");
  if (navBtn) navBtn.addEventListener("click", toggleSidebar);

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("focus", openSearch);
    searchInput.addEventListener("input", () => {
      if (!document.body.classList.contains("searchOpen")) openSearch();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSearch();
      document.body.classList.remove("sidebarOpen");
      return;
    }

    const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K");
    if (isCtrlK) {
      e.preventDefault();
      openSearch();
    }
  });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("searchPanel");
    const input = document.getElementById("globalSearch");

    if (document.body.classList.contains("searchOpen")) {
      const clickedInside =
        (panel && panel.contains(e.target)) || (input && input.contains(e.target));
      if (!clickedInside) closeSearch();
    }

    if (document.body.classList.contains("sidebarOpen")) {
      const sidebar = document.getElementById("appSidebar");
      const btn = document.getElementById("navToggle");
      const clickedInside = (sidebar && sidebar.contains(e.target)) || (btn && btn.contains(e.target));
      if (!clickedInside) document.body.classList.remove("sidebarOpen");
    }
  });

  window.addEventListener("popstate", setActiveLinks);
  window.addEventListener("pageshow", setActiveLinks);
  document.addEventListener("app:navigated", setActiveLinks);
}
