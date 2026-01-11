import { SPELLS } from "../data/spells.js"

function el(tag, cls) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  return n
}

export function hydrateSpellRefs(scope = document) {
  const nodes = scope.querySelectorAll("[data-spell]")
  for (const node of nodes) {
    if (node.dataset.hydrated === "1") continue
    node.dataset.hydrated = "1"

    const key = node.dataset.spell
    const s = SPELLS[key]
    if (!s) continue

    const wrap = el("span", "spellRef")
    const img = el("img", "spellIcon")
    img.loading = "lazy"
    img.alt = ""
    img.src = s.icon

    const text = el("span", "spellName")
    text.textContent = s.name

    wrap.appendChild(img)
    wrap.appendChild(text)

    node.replaceWith(wrap)
  }
}