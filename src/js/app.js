import { boot } from "./init/boot.js"
import { enhanceNavigation } from "./router.js"
import { initTheme } from "./init/theme.js"
import { initAnalytics, trackPageView } from "./init/analytics.js"
import { initControls } from "./ui/controls.js"
import { initSearch } from "./ui/search.js"
import { initSwingLab } from "./tools/swing_lab.js"
import { hydrateSpellRefs } from "./ui/spell_refs.js"

const CACHE_BUSTER_KEY = "assetCacheBuster"

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
  hydrateSpellRefs(scope)

  const lab = scope.querySelector("#airTwistLab")
  if (lab && lab.dataset.mounted !== "1") {
    lab.dataset.mounted = "1"
    const mod = await import("./tools/airTwistLab.js")
    mod.mountAirTwistLab(lab)
  }

  const fireLab = scope.querySelector("#fireTwistLab")
  if (fireLab && fireLab.dataset.mounted !== "1") {
    fireLab.dataset.mounted = "1"
    const mod = await import("./tools/fireTwistLab.js")
    mod.mountFireTwistLab(fireLab)
  }

  const talentLab = scope.querySelector("#talentLab")
  if (talentLab && talentLab.dataset.mounted !== "1") {
    talentLab.dataset.mounted = "1"
    const mod = await import("./tools/talentLab.js")
    mod.mountTalentLab(talentLab)
  }
}

function rehydratePage() {
  initSwingLab()
  const appMain = document.getElementById("appMain") || document
  mountPageTools(appMain)
}

;(async function start() {
  initTheme()
  initAnalytics()
  bustStylesheets()
  await boot()
  updateHeaderOffset()

  initControls()
  initSearch()
  rehydratePage()

  enhanceNavigation()
  document.addEventListener("app:navigated", () => {
    rehydratePage()
    trackPageView()
  })
  window.addEventListener("resize", updateHeaderOffset)
})()


