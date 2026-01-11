import { boot } from "./init/boot.js"
import { enhanceNavigation } from "./router.js"
import { initTheme } from "./init/theme.js"
import { initControls } from "./ui/controls.js"
import { initSearch } from "./ui/search.js"
import { initSwingLab } from "./tools/swing_lab.js"
import { hydrateSpellRefs } from "./ui/spell_refs.js"

function rehydratePage() {
  initSwingLab()
  hydrateSpellRefs(document.getElementById("appMain") || document)
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

