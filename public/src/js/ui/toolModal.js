let bound = false

const TOOL_MAP = {
  swing: {
    title: "Swing Sync and Stagger Trainer",
    url: "/pages/guide/sync_stagger.html#trainer",
  },
  talents: {
    title: "Talent Planner",
    url: "/pages/guide/talents.html#talent-module",
  },
  air: {
    title: "Air Totem Twisting Lab",
    url: "/pages/guide/air_totem_weaving.html#air-twist-lab",
  },
  fire: {
    title: "Fire Totem Twisting Lab",
    url: "/pages/guide/fire_totem_weaving.html#fire-twist-lab",
  },
}

function toEmbedUrl(raw) {
  const u = new URL(raw, window.location.origin)
  u.searchParams.set("embed", "1")
  return u.pathname + u.search + u.hash
}

function openToolByKey(key) {
  const t = TOOL_MAP[key]
  if (!t) return

  const dlg = document.getElementById("toolModal")
  const frame = document.getElementById("toolFrame")
  const titleEl = document.getElementById("toolModalTitle")
  const fullEl = document.getElementById("toolModalFull")

  if (!dlg || !frame || typeof dlg.showModal !== "function") {
    window.location.href = t.url
    return
  }

  titleEl.textContent = t.title
  fullEl.href = t.url
  frame.title = t.title

  const embedUrl = toEmbedUrl(t.url)

  dlg.showModal()
  frame.src = "about:blank"
  requestAnimationFrame(() => {
    frame.src = embedUrl
  })
}

export function bindToolModalOnce() {
  if (bound) return
  bound = true

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-open-tool]")
    if (btn) {
      ev.preventDefault()
      openToolByKey(btn.getAttribute("data-open-tool"))
      return
    }

    // Close button you already have
    if (ev.target && ev.target.id === "toolModalClose") {
      ev.preventDefault()
      const dlg = document.getElementById("toolModal")
      dlg?.close()
      return
    }

    // Backdrop click close
    const dlg = document.getElementById("toolModal")
    if (dlg && ev.target === dlg) {
      dlg.close()
    }
  })

  const dlg = document.getElementById("toolModal")
  const frame = document.getElementById("toolFrame")

  dlg?.addEventListener("close", () => {
    if (frame) frame.src = "about:blank"
  })
}
