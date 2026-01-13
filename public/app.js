import { boot } from "./src/js/init/boot.js"
import { enhanceNavigation } from "./router.js"
import { initAnalytics, trackPageView } from "./src/js/init/analytics.js"
import { initControls } from "./src/js/ui/controls.js"
import { initSwingLab } from "./src/js/tools/swing_lab.js"
import { hydrateSpellRefs } from "./src/js/ui/spell_refs.js"
import { bindToolModalOnce } from "./src/js/ui/toolModal.js"

let toolHandlersBound = false;

export function mountToolLaunchers(scope = document) {
  if (toolHandlersBound) return;
  toolHandlersBound = true;

  function toEmbedUrl(raw) {
    const u = new URL(raw, window.location.origin);
    u.searchParams.set("embed", "1");
    return u.pathname + u.search + u.hash;
  }

  function openTool(url, title) {
    const dlg = document.getElementById("toolModal");
    const frame = document.getElementById("toolFrame");
    const titleEl = dlg?.querySelector(".tool_modal_title");

    if (!dlg || !frame) return;

    if (titleEl) titleEl.textContent = title || "Tool";

    frame.src = "about:blank";
    dlg.showModal();

    requestAnimationFrame(() => {
      frame.src = toEmbedUrl(url);
    });
  }

  function closeTool() {
    const dlg = document.getElementById("toolModal");
    const frame = document.getElementById("toolFrame");
    if (frame) frame.src = "about:blank";
    if (dlg?.open) dlg.close();
  }

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-tool]");
    if (openBtn) {
      e.preventDefault();
      openTool(
        openBtn.dataset.openTool,
        openBtn.dataset.toolTitle
      );
    }

    const closeBtn = e.target.closest("[data-tool-close]");
    if (closeBtn) {
      e.preventDefault();
      closeTool();
    }
  });

  document.addEventListener("close", (e) => {
    if (e.target?.id === "toolModal") {
      const frame = document.getElementById("toolFrame");
      if (frame) frame.src = "about:blank";
    }
  }, true);
}

let toolLauncherBound = false;

function bindToolLauncher() {
  if (toolLauncherBound) return;
  toolLauncherBound = true;

  function toEmbedUrl(rawUrl) {
    const u = new URL(rawUrl, window.location.origin);
    u.searchParams.set("embed", "1");
    return u.pathname + u.search + u.hash;
  }

  function closeToolModal() {
    const dlg = document.getElementById("toolModal");
    const frame = document.getElementById("toolFrame");
    if (frame) frame.src = "about:blank";
    if (dlg && dlg.open) dlg.close();
  }

  function openToolModal(rawUrl, title) {
    const dlg = document.getElementById("toolModal");
    const frame = document.getElementById("toolFrame");
    const titleEl = document.querySelector("#toolModal .tool_modal_title");
    if (!dlg || !frame) return;

    if (titleEl) titleEl.textContent = title || "Tool";

    frame.src = "about:blank";
    dlg.showModal();

    const embedUrl = toEmbedUrl(rawUrl);
    setTimeout(() => {
      frame.src = embedUrl;
    }, 0);
  }

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-open-tool]");
    if (!btn) return;

    ev.preventDefault();
    openToolModal(btn.getAttribute("data-open-tool"), btn.getAttribute("data-tool-title"));
  });

  document.addEventListener("click", (ev) => {
    const closeBtn = ev.target.closest("[data-tool-close]");
    if (!closeBtn) return;

    ev.preventDefault();
    closeToolModal();
  });

  // Handle ESC close on <dialog>
  document.addEventListener(
    "close",
    (ev) => {
      if (ev.target && ev.target.id === "toolModal") {
        const frame = document.getElementById("toolFrame");
        if (frame) frame.src = "about:blank";
      }
    },
    true
  );
}

const CACHE_BUSTER_KEY = "assetCacheBuster"

function applyEmbedMode() {
  const params = new URLSearchParams(window.location.search)
  if (params.get("embed") === "1") {
    document.documentElement.classList.add("embed")
  } else {
    document.documentElement.classList.remove("embed")
  }
}

applyEmbedMode()

function applyEmbedFocus() {
  if (!document.documentElement.classList.contains("embed")) return

  const hash = window.location.hash
  if (!hash || hash.length < 2) return

  const id = decodeURIComponent(hash.slice(1))
  const target = document.getElementById(id)
  const main = document.getElementById("appMain")
  if (!target || !main) return

  // Keep only the hashed section in the main content area.
  if (main.children.length === 1 && main.firstElementChild === target) return
  main.replaceChildren(target)

  // Ensure the tool starts at the top inside the iframe.
  window.scrollTo(0, 0)
}

function getAssetCacheBuster() {
  const existing = sessionStorage.getItem(CACHE_BUSTER_KEY)
  if (existing) return existing
  const next = Date.now().toString()
  sessionStorage.setItem(CACHE_BUSTER_KEY, next)
  return next
}

function bustStylesheets() {
  const buster = getAssetCacheBuster()
  const links = document.querySelectorAll('link[rel="stylesheet"]')
  links.forEach((link) => {
    try {
      const url = new URL(link.href, window.location.origin)
      if (url.searchParams.get("v") === buster) return
      url.searchParams.set("v", buster)
      link.href = url.toString()
    } catch (err) {
      console.warn("Failed to update stylesheet cache buster", err)
    }
  })
}

function updateHeaderOffset() {
  const header = document.getElementById("appHeader")
  if (!header) return
  const height = header.offsetHeight || 0
  document.documentElement.style.setProperty("--app-header-height", `${height}px`)
}

async function mountPageTools(scope) {
  bindToolModalOnce()
  hydrateSpellRefs(scope)

  const lab = scope.querySelector("#airTwistLab")
  if (lab && lab.dataset.mounted !== "1") {
    lab.dataset.mounted = "1"
    const mod = await import("./src/js/tools/airTwistLab.js")
    mod.mountAirTwistLab(lab)
  }

  const fireLab = scope.querySelector("#fireTwistLab")
  if (fireLab && fireLab.dataset.mounted !== "1") {
    fireLab.dataset.mounted = "1"
    const mod = await import("./src/js/tools/fireTwistLab.js")
    mod.mountFireTwistLab(fireLab)
  }

  const talentLab = scope.querySelector("#talentLab")
  if (talentLab && talentLab.dataset.mounted !== "1") {
    talentLab.dataset.mounted = "1"
    const mod = await import("./src/js/tools/talentLab.js")
    mod.mountTalentLab(talentLab)
  }
}

function rehydratePage() {
  applyEmbedMode()
  applyEmbedFocus()

  initSwingLab()
  const appMain = document.getElementById("appMain") || document
  mountPageTools(appMain)
}

;(async function start() {
  initAnalytics()
  bustStylesheets()
  await boot()
  updateHeaderOffset()

  initControls()
  rehydratePage()

  enhanceNavigation()
  document.addEventListener("app:navigated", () => {
    rehydratePage()
    trackPageView()
  })
  window.addEventListener("hashchange", applyEmbedFocus)
  window.addEventListener("resize", updateHeaderOffset)
})()


