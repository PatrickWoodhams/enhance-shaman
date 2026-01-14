import { buildToc } from "./src/js/ui/toc.js";

function applyEmbedMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") {
    document.documentElement.classList.add("embed");
  } else {
    document.documentElement.classList.remove("embed");
  }
}

function isInternalLink(a) {
  if (!a || !a.href) return false;
  try {
    const url = new URL(a.href, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function shouldBypassSpaNavigation(e, a) {
  // Respect any other handler that already claimed the click (tool modal does this)
  if (e.defaultPrevented) return true;

  // Only intercept plain left clicks
  if (e.button !== 0) return true;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true;

  // Let the browser handle new tab, downloads, and explicit external intent
  const target = (a.getAttribute("target") || "").toLowerCase();
  if (target && target !== "_self") return true;
  if (a.hasAttribute("download")) return true;

  const rel = (a.getAttribute("rel") || "").toLowerCase();
  if (rel.includes("external")) return true;

  return false;
}

function scrollToHashIfNeeded() {
  const hash = window.location.hash;
  if (!hash) return;

  const id = hash.slice(1);
  if (!id) return;

  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ block: "start" });
}

function stripHash(urlPath) {
  const i = urlPath.indexOf("#");
  return i === -1 ? urlPath : urlPath.slice(0, i);
}

function normalizeInternalPath(url) {
  let pathname = url.pathname;

  // Legacy aliases (your comment mentioned seeing /talent)
  if (pathname === "/talent" || pathname === "/talents") {
    pathname = "/guide/talents";
  }

  // Convert old file paths into clean routes
  // /pages/guide/sync_stagger.html -> /guide/sync-stagger
  if (pathname === "/pages/guide/index.html" || pathname === "/pages/guide/index") {
    pathname = "/guide";
  } else if (pathname.startsWith("/pages/guide/")) {
    const file = pathname.slice("/pages/guide/".length);
    const base = file.replace(/\.html$/i, "");
    pathname = base === "index" ? "/guide" : `/guide/${base.replace(/_/g, "-")}`;
  }

  // /pages/tools/index.html -> /tools, /pages/tools/something.html -> /tools/something
  if (pathname === "/pages/tools/index.html" || pathname === "/pages/tools/index") {
    pathname = "/tools";
  } else if (pathname.startsWith("/pages/tools/")) {
    const file = pathname.slice("/pages/tools/".length);
    const base = file.replace(/\.html$/i, "");
    pathname = base === "index" ? "/tools" : `/tools/${base.replace(/_/g, "-")}`;
  }

  // Simple section indexes
  if (pathname === "/pages/builds/index.html" || pathname === "/pages/builds/index") pathname = "/builds";
  if (pathname === "/pages/encounters/index.html" || pathname === "/pages/encounters/index") pathname = "/encounters";

  return pathname + url.search + url.hash;
}

async function swapMainContent(urlPath, skipHistory = false) {
  document.body.classList.add("isNavigating");

  try {
    const res = await fetch(stripHash(urlPath), { headers: { "X-Requested-With": "fetch" } });
    if (!res.ok) throw new Error(`Navigation fetch failed: ${urlPath}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const nextMain = doc.querySelector("#appMain");
    const main = document.querySelector("#appMain");

    if (!main || !nextMain) {
      window.location.href = urlPath;
      return;
    }

    // ADD THIS: keep body class in sync with the destination page
    // Preserve your runtime class used for transitions
    const keep = document.body.classList.contains("isNavigating") ? ["isNavigating"] : [];
    const nextBodyClasses = (doc.body && doc.body.className) ? doc.body.className : "";
    document.body.className = [...keep, ...nextBodyClasses.split(/\s+/).filter(Boolean)].join(" ");

    main.innerHTML = nextMain.innerHTML;

    const nextTitle = doc.querySelector("title");
    if (nextTitle) document.title = nextTitle.textContent || document.title;

    if (!skipHistory) {
      history.pushState({}, "", urlPath);
    }

    applyEmbedMode();
    buildToc();

    const mainEl = document.getElementById("appMain");
    if (mainEl) mainEl.focus();

    window.scrollTo(0, 0);
    scrollToHashIfNeeded();

    document.dispatchEvent(new CustomEvent("app:navigated"));
  } finally {
    document.body.classList.remove("isNavigating");
  }
}


export function enhanceNavigation() {
  buildToc();
  applyEmbedMode();

  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    if (shouldBypassSpaNavigation(e, a)) return;
    if (!isInternalLink(a)) return;

    const rawUrl = new URL(a.href, window.location.origin);
    const nextPath = normalizeInternalPath(rawUrl);
    const nextUrl = new URL(nextPath, window.location.origin);

    // Allow same page hash jumps without swapping content
    if (
      nextUrl.pathname === window.location.pathname &&
      nextUrl.search === window.location.search &&
      nextUrl.hash
    ) {
      return;
    }

    e.preventDefault();

    try {
      await swapMainContent(nextUrl.pathname + nextUrl.search + nextUrl.hash);
    } catch (err) {
      console.warn(err);
      window.location.href = nextUrl.pathname + nextUrl.search + nextUrl.hash;
    }
  });

  window.addEventListener("popstate", async () => {
    applyEmbedMode();
    try {
      await swapMainContent(
        window.location.pathname + window.location.search + window.location.hash,
        true
      );
    } catch {
      window.location.reload();
    }
  });
}
