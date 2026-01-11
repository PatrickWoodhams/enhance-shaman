import { boot } from "./init/boot.js"
import { enhanceNavigation } from "./router.js"
import { initTheme } from "./init/theme.js"
import { initControls } from "./ui/controls.js"
import { initSearch } from "./ui/search.js"
import { initSwingLab } from "./tools/swing_lab.js"
import { hydrateSpellRefs } from "./ui/spell_refs.js"

async function mountPageTools(scope) {
  hydrateSpellRefs(scope)

  const lab = scope.querySelector("#airTwistLab")
  if (lab && lab.dataset.mounted !== "1") {
    lab.dataset.mounted = "1"
    const mod = await import("./tools/airTwistLab.js")
    mod.mountAirTwistLab(lab)
  }
}

function rehydratePage() {
  initSwingLab()
  const appMain = document.getElementById("appMain") || document
  mountPageTools(appMain)
}

;(async function start() {
  initTheme()
  await boot()

  initControls()
  initSearch()
  rehydratePage()

  enhanceNavigation()
  document.addEventListener("app:navigated", rehydratePage)
})()

