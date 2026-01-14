import { boot } from "./src/js/init/boot.js"
import { enhanceNavigation } from "./router.js"
import { initAnalytics, trackPageView } from "./src/js/init/analytics.js"
import { initControls } from "./src/js/ui/controls.js"
import { initSwingLab } from "./src/js/tools/swing_lab.js"
import { hydrateSpellRefs } from "./src/js/ui/spell_refs.js"
// Remove this import:
// import { bindToolModalOnce } from "./src/js/ui/toolModal.js"

const TOOL_MODAL_STYLE_ID = "toolModalStyles"
let toolLauncherBound = false

const TOOL_MAP = {
  swing: { title: "Swing Sync and Stagger Trainer", url: "/pages/guide/sync_stagger.html#trainer" },
  talents: { title: "Talent Planner", url: "/pages/guide/talents.html#talent-module" },
  air: { title: "Air Totem Twisting Lab", url: "/pages/guide/air_totem_weaving.html#air-twist-lab" },
  fire: { title: "Fire Totem Twisting Lab", url: "/pages/guide/fire_totem_weaving.html#fire-twist-lab" },
}

function ensureToolModalShell() {
  if (!document.getElementById(TOOL_MODAL_STYLE_ID)) {
    const style = document.createElement("style")
    style.id = TOOL_MODAL_STYLE_ID
    style.textContent = `
      .toolDialog { width: min(1180px, 96vw); height: min(86vh, 920px); padding: 0; border: 1px solid var(--stroke); border-radius: var(--r2); background: var(--bg2); color: var(--fg); box-shadow: var(--shadow); }
      .toolDialog::backdrop { background: rgba(0,0,0,0.66); }
      .toolDialogHeader { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; border-bottom:1px solid var(--stroke); background: rgba(255,255,255,0.03); }
      .toolDialogTitle { display:flex; align-items:baseline; gap:10px; min-width:0; }
      .toolDialogTitle h2 { margin:0; font-size:14px; letter-spacing:0.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .toolDialogHint { color: var(--fg3); font-size:12px; white-space:nowrap; }
      .toolDialogActions { display:flex; align-items:center; gap:8px; flex:0 0 auto; }
      .toolDialogBody { height: calc(100% - 54px); }
      .toolFrame { display:block; width:100%; height:100%; border:0; background: var(--bg); }
    `
    document.head.appendChild(style)
  }

  if (document.getElementById("toolModal")) return

  const dlg = document.createElement("dialog")
  dlg.id = "toolModal"
  dlg.className = "toolDialog"
  dlg.setAttribute("aria-labelledby", "toolModalTitle")
  dlg.innerHTML = `
    <div class="toolDialogHeader">
      <div class="toolDialogTitle">
        <h2 id="toolModalTitle">Tool</h2>
        <div class="toolDialogHint">Esc to close</div>
      </div>
      <div class="toolDialogActions">
        <a id="toolModalFull" class="btn btnGhost" href="#" target="_blank" rel="noopener">Open full page</a>
        <button id="toolModalClose" class="btn" type="button" aria-label="Close">Close</button>
      </div>
    </div>
    <div class="toolDialogBody">
      <iframe id="toolFrame" class="toolFrame" title="Tool"></iframe>
    </div>
  `
  document.body.appendChild(dlg)

  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) dlg.close()
  })

  dlg.addEventListener("close", () => {
    const frame = document.getElementById("toolFrame")
    if (frame) frame.src = "about:blank"
  })
}

function toEmbedUrl(rawUrl) {
  const u = new URL(rawUrl, window.location.origin)
  u.searchParams.set("embed", "1")
  return u.pathname + u.search + u.hash
}

function resolveTool(raw, titleHint) {
  const mapped = TOOL_MAP[raw]
  if (mapped) return { url: mapped.url, title: mapped.title }
  return { url: raw, title: titleHint || "Tool" }
}

function bindToolLauncherOnce() {
  if (toolLauncherBound) return
  toolLauncherBound = true

  ensureToolModalShell()

  document.addEventListener("click", (ev) => {
    const openBtn = ev.target.closest("[data-open-tool]")
    if (openBtn) {
      ev.preventDefault()

      const raw = openBtn.getAttribute("data-open-tool") || ""
      const titleHint = openBtn.getAttribute("data-tool-title") || ""
      const { url, title } = resolveTool(raw, titleHint)

      const dlg = document.getElementById("toolModal")
      const frame = document.getElementById("toolFrame")
      const titleEl = document.getElementById("toolModalTitle")
      const fullEl = document.getElementById("toolModalFull")

      if (!dlg || !frame || typeof dlg.showModal !== "function") {
        window.location.href = url
        return
      }

      if (titleEl) titleEl.textContent = title
      if (fullEl) fullEl.href = url
      frame.title = title

      frame.src = "about:blank"
      dlg.showModal()

      const embedUrl = toEmbedUrl(url)
      setTimeout(() => { frame.src = embedUrl }, 0)
      return
    }

    const closeBtn = ev.target.closest("[data-tool-close], #toolModalClose")
    if (closeBtn) {
      ev.preventDefault()
      const dlg = document.getElementById("toolModal")
      const frame = document.getElementById("toolFrame")
      if (frame) frame.src = "about:blank"
      if (dlg && dlg.open) dlg.close()
    }
  })
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

function ensurePageCss(scope) {
  const marker = scope.querySelector("[data-page-css]")
  const raw = marker?.getAttribute("data-page-css") || ""

  // Allow multiple hrefs separated by spaces
  const hrefs = raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Remove any existing runtime links that are no longer needed
  const existing = Array.from(document.querySelectorAll('link[data-runtime-page-css="1"]'))

  const buster = getAssetCacheBuster()

  // Ensure we have exactly hrefs.length runtime links
  for (let i = 0; i < hrefs.length; i++) {
    const desiredHref = hrefs[i]

    let link = existing[i]
    if (!link) {
      link = document.createElement("link")
      link.rel = "stylesheet"
      link.setAttribute("data-runtime-page-css", "1")
      document.head.appendChild(link)
    }

    // Apply session cache buster so runtime injected CSS behaves like your boot time CSS
    try {
      const url = new URL(desiredHref, window.location.origin)
      url.searchParams.set("v", buster)
      const finalHref = url.toString()
      if (link.href !== finalHref) link.href = finalHref
    } catch {
      if (link.getAttribute("href") !== desiredHref) link.href = desiredHref
    }
  }

  // Remove extra runtime links
  for (let i = hrefs.length; i < existing.length; i++) {
    existing[i].remove()
  }

  // If no page css is specified, remove all runtime links
  if (hrefs.length === 0) {
    existing.forEach((l) => l.remove())
  }
}


async function mountPageTools(scope) {
  ensurePageCss(scope)
  bindToolLauncherOnce()
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


