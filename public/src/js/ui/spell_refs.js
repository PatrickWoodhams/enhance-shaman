import { SPELLS, iconUrl } from "../data/spells.js"

const UNKNOWN_ICON = iconUrl("inv_misc_questionmark")

function el(tag, cls) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  return n
}

function titleFromKey(key = "") {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function hydrateSpellRefs(scope = document) {
  const nodes = scope.querySelectorAll("[data-spell]")
  for (const node of nodes) {
    if (node.dataset.hydrated === "1") continue
    node.dataset.hydrated = "1"

    const key = node.dataset.spell
    const s = SPELLS[key]

    const wrap = el("span", "spellRef")
    const img = el("img", "spellIcon")
    img.loading = "lazy"
    img.alt = ""
    img.src = s?.icon || UNKNOWN_ICON

    const text = el("span", "spellName")
    text.textContent = s?.name || titleFromKey(key)

    wrap.appendChild(img)
    wrap.appendChild(text)

    node.replaceWith(wrap)
  }
}
