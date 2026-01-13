import { Shaman as TALENT_INFO } from "../data/talent-info.js"

// /src/js/tools/talentLab.js

function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const TALENT_ASSETS = {
  elemental: {
    iconDir: "spec1",
    background: "/assets/talents/Background/Elemental.jpg",
    logo: "/assets/talents/Spec1Logo.jpg",
  },
  enhancement: {
    iconDir: "spec2",
    background: "/assets/talents/Background/Enhancement.jpg",
    logo: "/assets/talents/Spec2Logo.jpg",
  },
  restoration: {
    iconDir: "spec3",
    background: "/assets/talents/Background/Restoration.jpg",
    logo: "/assets/talents/Spec3Logo.jpg",
  },
}

function talentAssetName(name) {
  return String(name || "")
    .replace(/'/g, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join("")
}

function talentIconUrl(treeKey, name) {
  const assets = TALENT_ASSETS[treeKey]
  if (!assets) return ""
  const base = talentAssetName(name)
  if (!base) return ""
  return `/assets/talents/Progression/${assets.iconDir}/${base}.jpg`
}

const TALENT_DATA = {
  game: "tbc",
  class: "shaman",
  total_points: 61,
  tiers: 9,
  cols: 4,

  trees: [
    {
      key: "elemental",
      label: "Elemental",
      talents: [
        { name: "Convection", tier: 1, max: 5 },
        { name: "Concussion", tier: 1, max: 5 },

        { name: "Earth's Grasp", tier: 2, max: 2 },
        { name: "Elemental Warding", tier: 2, max: 3 },
        { name: "Call of Flame", tier: 2, max: 3 },

        { name: "Elemental Focus", tier: 3, max: 1 },
        { name: "Reverberation", tier: 3, max: 5 },
        { name: "Call of Thunder", tier: 3, max: 5 },

        { name: "Improved Fire Totems", tier: 4, max: 2 },
        { name: "Eye of the Storm", tier: 4, max: 3 },
        { name: "Elemental Devastation", tier: 4, max: 3, col: 4 },

        { name: "Storm Reach", tier: 5, max: 2 },
        { name: "Elemental Fury", tier: 5, max: 1 },
        { name: "Unrelenting Storm", tier: 5, max: 5, col: 4 },

        { name: "Elemental Precision", tier: 6, max: 3, col: 1 },
        { name: "Lightning Mastery", tier: 6, max: 5, col: 3, req: "Call of Thunder" },

        { name: "Elemental Mastery", tier: 7, max: 1, req: "Elemental Fury" },
        { name: "Elemental Shields", tier: 7, max: 3 },

        { name: "Lightning Overload", tier: 8, max: 5 },

        { name: "Totem of Wrath", tier: 9, max: 1, req: "Lightning Overload" },
      ],
    },

    {
      key: "enhancement",
      label: "Enhancement",
      talents: [
        { name: "Ancestral Knowledge", tier: 1, max: 5 },
        { name: "Shield Specialization", tier: 1, max: 5 },

        { name: "Guardian Totems", tier: 2, max: 2 },
        { name: "Thundering Strikes", tier: 2, max: 5 },
        { name: "Improved Ghost Wolf", tier: 2, max: 2 },
        { name: "Improved Lightning Shield", tier: 2, max: 3 },

  
        { name: "Enhancing Totems", tier: 3, max: 2 },
        { name: "Shamanistic Focus", tier: 3, max: 1, col: 3 },
        { name: "Anticipation", tier: 3, max: 5, col: 4 },


        { name: "Flurry", tier: 4, max: 5, req: "Thundering Strikes" },
        { name: "Toughness", tier: 4, max: 5 },

        { name: "Improved Weapon Totems", tier: 5, max: 2 },
        { name: "Spirit Weapons", tier: 5, max: 1 },
        { name: "Elemental Weapons", tier: 5, max: 3 },

        { name: "Mental Quickness", tier: 6, max: 3, col: 1 },
        { name: "Weapon Mastery", tier: 6, max: 5, col: 4 },

        { name: "Dual Wield Specialization", tier: 7, max: 3, req: "Dual Wield" },
        { name: "Dual Wield", tier: 7, max: 1, req: "Spirit Weapons" },
        { name: "Stormstrike", tier: 7, max: 1, req: "Elemental Weapons" },

        { name: "Unleashed Rage", tier: 8, max: 5 },

        { name: "Shamanistic Rage", tier: 9, max: 1 },
      ],
    },

    {
      key: "restoration",
      label: "Restoration",
      talents: [
        { name: "Improved Healing Wave", tier: 1, max: 5 },
        { name: "Tidal Focus", tier: 1, max: 5 },

        { name: "Improved Reincarnation", tier: 2, max: 2 },
        { name: "Ancestral Healing", tier: 2, max: 3 },
        { name: "Totemic Focus", tier: 2, max: 5 },

        { name: "Nature's Guidance", tier: 3, max: 3 },
        { name: "Healing Focus", tier: 3, max: 5 },
        { name: "Totemic Mastery", tier: 3, max: 1 },
        { name: "Healing Grace", tier: 3, max: 3 },

        { name: "Restorative Totems", tier: 4, max: 5 },
        { name: "Tidal Mastery", tier: 4, max: 5 },

        { name: "Healing Way", tier: 5, max: 3 },
        { name: "Nature's Swiftness", tier: 5, max: 1, col: 3 },
        { name: "Focused Mind", tier: 5, max: 3, col: 4 },

        { name: "Purification", tier: 6, max: 5, col: 3 },

        { name: "Mana Tide Totem", tier: 7, max: 1, req: "Restorative Totems" },
        { name: "Nature's Guardian", tier: 7, max: 5 },

        { name: "Nature's Blessing", tier: 8, max: 3 },
        { name: "Improved Chain Heal", tier: 8, max: 2 },

        { name: "Earth Shield", tier: 9, max: 1, req: "Nature's Blessing" },
      ],
    },
  ],
}

const TALENT_TOOLTIP_MAP = new Map()
for (const talent of TALENT_INFO) {
  const key = String(talent.name || "").trim().toLowerCase()
  if (!key) continue
  const list = Array.isArray(talent.toolTip) ? talent.toolTip : []
  TALENT_TOOLTIP_MAP.set(key, list)
}

const TALENT_DECOR_ARROWS = [
  {
    tree: "elemental",
    from: "Call of Thunder",
    to: "Lightning Mastery",
    asset: "/assets/talents/Arrows/DownSilverLarge.png",
    activeAsset: "/assets/Arrows/DownGoldLarge.png",
    height: 132,
    offsetY: "2px",
    requireMax: true,
  },
  {
    tree: "elemental",
    from: "Elemental Fury",
    to: "Elemental Mastery",
    asset: "/assets/talents/Arrows/DownSilverMedium.png",
    activeAsset: "/assets/talents/Arrows/DownGoldMedium.png",
    bleedBottom: 34,
    requireMax: true,
  },
  {
    tree: "elemental",
    from: "Lightning Overload",
    to: "Totem of Wrath",
    asset: "/assets/talents/Arrows/DownSilverSmall.png",
    activeAsset: "/assets/talents/Arrows/DownGoldSmall.png",
    height: 32,
    bleedTop: 0,
    bleedBottom: 0,
    offsetY: "calc(-0.5 * (var(--arrow-height, 28px) + var(--talent_gap_y, 14px)) + 2px)",
    requireMax: false,
  },
  {
    tree: "enhancement",
    from: "Thundering Strikes",
    to: "Flurry",
    asset: "/assets/talents/Arrows/DownSilverMedium.png",
    activeAsset: "/assets/talents/Arrows/DownGoldMedium.png",
    bleedBottom: 34,
    requireMax: true,
  },
  {
    tree: "enhancement",
    from: "Spirit Weapons",
    to: "Dual Wield",
    asset: "/assets/talents/Arrows/DownSilverMedium.png",
    activeAsset: "/assets/talents/Arrows/DownGoldMedium.png",
    bleedBottom: 34,
    requireMax: true,
  },
  {
    tree: "enhancement",
    from: "Elemental Weapons",
    to: "Stormstrike",
    asset: "/assets/talents/Arrows/DownSilverMedium.png",
    activeAsset: "/assets/talents/Arrows/DownGoldMedium.png",
    bleedBottom: 34,
    requireMax: true,
  },
  {
    tree: "enhancement",
    from: "Dual Wield",
    to: "Dual Wield Specialization",
    asset: "/assets/talents/Arrows/LeftSilverSmall.png",
    activeAsset: "/assets/talents/Arrows/LeftGoldSmall.png",
    height: 15, 
    width:32,
    bleedRight: 0,
    bleedLeft: -15,
    offsetX: "-50px", 
    requireMax: false,
  },
  {
    tree: "restoration",
    from: "Restorative Totems",
    to: "Mana Tide Totem",
    asset: "/assets/talents/Arrows/DownSilverLarge.png",
    activeAsset: "/assets/talents/Arrows/DownGoldLarge.png",
    height: 132,
    offsetY: "2px",
    requireMax: true,
  },
  {
    tree: "restoration",
    from: "Nature's Blessing",
    to: "Earth Shield",
    asset: "/assets/talents/Arrows/DownSilverSmall.png",
    activeAsset: "/assets/talents/Arrows/DownGoldSmall.png",
    height: 32,
    bleedTop: 0,
    bleedBottom: 0,
    offsetY: "calc(-0.5 * (var(--arrow-height, 28px) + var(--talent_gap_y, 14px)) + 2px)",
    requireMax: false,
  },
]

function buildTalentIndex(data) {
  const byId = {}
  const byName = {}
  for (const tree of data.trees) {
    for (const t of tree.talents) {
      const id = `${tree.key}_${slug(t.name)}`
      const node = {
        id,
        tree: tree.key,
        tree_label: tree.label,
        name: t.name,
        icon: talentIconUrl(tree.key, t.name),
        tier: t.tier,
        max: t.max,
        req_name: t.req || null,
        req_id: null,
        col: 1,
        col_override: Number.isFinite(t.col) ? t.col : null,
      }
      byId[id] = node
      byName[`${tree.key}::${t.name}`] = id
    }
  }

  // Resolve prerequisite ids
  for (const id in byId) {
    const n = byId[id]
    if (!n.req_name) continue
    const reqId = byName[`${n.tree}::${n.req_name}`]
    if (reqId) n.req_id = reqId
  }

  // Assign columns per tier (centered and consistent)
  for (const tree of data.trees) {
    const rows = {}
    for (const t of tree.talents) {
      const id = `${tree.key}_${slug(t.name)}`
      const tier = byId[id].tier
      if (!rows[tier]) rows[tier] = []
      rows[tier].push(byId[id])
    }

    for (let tier = 1; tier <= data.tiers; tier++) {
      const list = rows[tier] || []
      const count = list.length

      let cols = []
      if (count === 1) cols = [2]
      else if (count === 2) cols = [2, 3]
      else if (count === 3) cols = [1, 2, 3]
      else cols = [1, 2, 3, 4]

      const taken = new Set()
      const floaters = []

      for (const n of list) {
        if (!Number.isFinite(n.col_override)) {
          floaters.push(n)
          continue
        }
        const desired = Math.min(Math.max(1, n.col_override), data.cols)
        if (taken.has(desired)) {
          floaters.push(n)
          continue
        }
        n.col = desired
        taken.add(desired)
      }

      const available = cols.filter((c) => !taken.has(c))
      for (let i = 0; i < floaters.length; i++) {
        floaters[i].col = available[i] || (i + 1)
      }
    }
  }

  return { byId }
}

function sumPoints(ranks, treeKey, idx) {
  let s = 0
  for (const id in idx.byId) {
    const n = idx.byId[id]
    if (n.tree !== treeKey) continue
    s += ranks[id] || 0
  }
  return s
}

function tierPoints(ranks, treeKey, tier, idx) {
  let s = 0
  for (const id in idx.byId) {
    const n = idx.byId[id]
    if (n.tree !== treeKey) continue
    if (n.tier !== tier) continue
    s += ranks[id] || 0
  }
  return s
}

function sumAllPoints(ranks) {
  let s = 0
  for (const id in ranks) s += ranks[id] || 0
  return s
}

function tierUnlocked(ranks, treeKey, tier, idx) {
  if (tier <= 1) return true
  const prev = pointsInPreviousTiers(ranks, treeKey, tier, idx)
  return prev >= (tier - 1) * 5
}

function pointsInPreviousTiers(ranks, treeKey, tier, idx) {
  let s = 0
  for (const id in idx.byId) {
    const n = idx.byId[id]
    if (n.tree !== treeKey) continue
    if (n.tier >= tier) continue
    s += ranks[id] || 0
  }
  return s
}

// Prereq rule: prereq must be maxed (5/5 if it is a 5 point talent)
function prereqMet(ranks, node, idx) {
  if (!node.req_id) return true

  const reqNode = idx.byId[node.req_id]
  const needed = reqNode ? reqNode.max : 1
  const have = ranks[node.req_id] || 0

  return have >= needed
}

function validateAll(ranks, data, idx) {
  // Total cap (important for URL loads and presets)
  if (sumAllPoints(ranks) > data.total_points) return false

  for (const id in idx.byId) {
    const n = idx.byId[id]
    const r = ranks[id] || 0
    if (r <= 0) continue

    if (r > n.max) return false
    if (!tierUnlocked(ranks, n.tree, n.tier, idx)) return false
    if (!prereqMet(ranks, n, idx)) return false
  }

  return true
}

function serializeBuild(ranks, data, idx) {
  const parts = []
  for (const tree of data.trees) {
    const nodes = Object.values(idx.byId)
      .filter((n) => n.tree === tree.key)
      .sort((a, b) => (a.tier - b.tier) || (a.col - b.col) || a.name.localeCompare(b.name))

    let s = ""
    for (const n of nodes) s += String(ranks[n.id] || 0)
    parts.push(s)
  }
  return parts.join(".")
}

function deserializeBuild(str, data, idx) {
  const ranks = {}
  const parts = String(str || "").split(".")
  if (parts.length !== data.trees.length) return null

  for (let ti = 0; ti < data.trees.length; ti++) {
    const tree = data.trees[ti]
    const nodes = Object.values(idx.byId)
      .filter((n) => n.tree === tree.key)
      .sort((a, b) => (a.tier - b.tier) || (a.col - b.col) || a.name.localeCompare(b.name))

    const seg = parts[ti] || ""
    if (seg.length !== nodes.length) return null

    for (let i = 0; i < nodes.length; i++) {
      const ch = seg[i]
      const v = Number(ch)
      if (!Number.isFinite(v) || v < 0 || v > nodes[i].max) return null
      if (v) ranks[nodes[i].id] = v
    }
  }

  if (!validateAll(ranks, data, idx)) return null
  return ranks
}

const PRESETS = [
  {
    key: "example",
    label: "Empty",
    apply(ranks, data, idx) {
      const next = {}
      
      if (!validateAll(next, data, idx)) return ranks
      return next
    },
  },
  {
    key: "enh_17_44_00",
    label: "17/44/00 Sub Elemental",
    apply(_ranks, data, idx) {
      const next = {
        elemental_convection: 2,
        elemental_concussion: 5,
        elemental_call_of_flame: 3,
        elemental_reverberation: 5,
        elemental_elemental_focus: 1,
        elemental_improved_fire_totems : 1,

        enhancement_ancestral_knowledge: 5,
        enhancement_thundering_strikes: 5,
        enhancement_improved_ghost_wolf: 2,
        enhancement_enhancing_totems: 2,
        enhancement_shamanistic_focus: 1,
        enhancement_flurry: 5,
        enhancement_toughness: 1,
        enhancement_elemental_weapons: 3,
        enhancement_spirit_weapons: 1,
        enhancement_mental_quickness: 3,
        enhancement_weapon_mastery: 5,
        enhancement_unleashed_rage: 5,
        enhancement_dual_wield: 1,
        enhancement_dual_wield_specialization: 3,
        enhancement_stormstrike: 1,
        enhancement_shamanistic_rage: 1,
      }
      if (!validateAll(next, data, idx)) return _ranks
      return next
    },
  },
  {
    key: "ele_03_44_14",
    label: "03/44/14 Sub Restoration",
    apply(_ranks, data, idx) {
      const next = {
        elemental_concussion: 3,

        enhancement_ancestral_knowledge: 5,
        enhancement_thundering_strikes: 5,
        enhancement_improved_ghost_wolf: 2,
        enhancement_enhancing_totems: 2,
        enhancement_shamanistic_focus: 1,
        enhancement_flurry: 5,
        enhancement_toughness: 1,
        enhancement_elemental_weapons: 3,
        enhancement_spirit_weapons: 1,
        enhancement_mental_quickness: 3,
        enhancement_weapon_mastery: 5,
        enhancement_unleashed_rage: 5,
        enhancement_dual_wield: 1,
        enhancement_dual_wield_specialization: 3,
        enhancement_stormstrike: 1,
        enhancement_shamanistic_rage: 1,

        restoration_improved_healing_wave: 5,
        restoration_totemic_focus: 5,
        restoration_natures_guidance: 3,
        restoration_totemic_mastery: 1,
      }
      if (!validateAll(next, data, idx)) return _ranks
      return next
    },
  },
]

export function mountTalentLab(root) {
  root.innerHTML = ""
  const idx = buildTalentIndex(TALENT_DATA)

  const state = {
    ranks: {},
    selected: null,
  }

  // Load from URL if present
  try {
    const url = new URL(window.location.href)
    const raw = url.searchParams.get("talents")
    if (raw) {
      const loaded = deserializeBuild(raw, TALENT_DATA, idx)
      if (loaded) state.ranks = loaded
    }
  } catch (_) {}

  const wrap = el("div", "talent_planner")

  const top = el("div", "talent_planner_top")
  const title = el("div", "talent_planner_title", "Talent Planner")
  const totals = el("div", "talent_planner_totals")

  const totalPts = el("div", "talent_stat")
  const totalPtsLabel = el("div", "talent_stat_label", "Total")
  const totalPtsVal = el("div", "talent_stat_value", "0 of " + TALENT_DATA.total_points)
  totalPts.append(totalPtsLabel, totalPtsVal)

  const perTree = el("div", "talent_tree_totals")
  const treeTotalsEls = {}
  for (const tree of TALENT_DATA.trees) {
    const s = el("div", "talent_stat")
    const l = el("div", "talent_stat_label", tree.label)
    const v = el("div", "talent_stat_value", "0")
    s.append(l, v)
    perTree.appendChild(s)
    treeTotalsEls[tree.key] = v
  }

  totals.append(totalPts, perTree)
  top.append(title, totals)

  const layout = el("div", "talent_planner_layout")
  const left = el("div", "talent_left")
  const right = el("div", "talent_right")

  const treesRow = el("div", "talent_trees_row")
  const treeUIs = {}

function makeTree(tree) {
  const panel = el("div", "talent_tree_panel")
  const assets = TALENT_ASSETS[tree.key]
  if (assets && assets.background) {
    panel.style.setProperty("--talent-bg", `url("${assets.background}")`)
  }

  const header = el("div", "talent_tree_header")

  const headerCard = el("div", "talent_tree_header_card")

  const leftSide = el("div", "talent_tree_header_left")

  const logo = el("img", "talent_tree_logo")
  logo.alt = `${tree.label} logo`
  logo.loading = "lazy"
  logo.decoding = "async"
  if (assets && assets.logo) logo.src = assets.logo

  const title = el("div", "talent_tree_title", tree.label)

  leftSide.append(logo, title)

  const points = el("div", "talent_tree_points", "0")

  headerCard.append(leftSide, points)
  header.appendChild(headerCard)

  const grid = el("div", "talent_tree_grid")
  grid.style.setProperty("--talent_cols", String(TALENT_DATA.cols))
  grid.style.setProperty("--talent_tiers", String(TALENT_DATA.tiers))

  // Build lookup for grid coords
  const nodes = Object.values(idx.byId)
    .filter((n) => n.tree === tree.key)
    .sort((a, b) => (a.tier - b.tier) || (a.col - b.col) || a.name.localeCompare(b.name))

  const coordMap = {}
  for (const n of nodes) coordMap[`${n.tier}:${n.col}`] = n

  const arrowEls = []
  const arrowLinks = TALENT_DECOR_ARROWS.filter((a) => a.tree === tree.key)
  if (arrowLinks.length) {
    const arrowLayer = el("div", "talent_tree_arrows")
    grid.appendChild(arrowLayer)

    for (const link of arrowLinks) {
      const from = idx.byId[`${tree.key}_${slug(link.from)}`]
      const to = idx.byId[`${tree.key}_${slug(link.to)}`]
      if (!from || !to) continue

      const isVertical = from.col === to.col
      const isHorizontal = from.tier === to.tier

      // Skip diagonals for now
      if (!isVertical && !isHorizontal) continue

      const arrow = el("div", "talent_arrow")

      if (isVertical) {
        const tierGap = Math.abs(from.tier - to.tier)
        const rowStart = Math.min(from.tier, to.tier) + 1
        const rowEnd = Math.max(from.tier, to.tier) + (tierGap === 1 ? 1 : 0)
        if (rowStart >= rowEnd) continue

        arrow.style.gridColumn = String(from.col)
        arrow.style.gridRow = `${rowStart} / ${rowEnd}`
      } else {
        arrow.classList.add("is_horizontal")

        const colGap = Math.abs(from.col - to.col)
        const colStart = Math.min(from.col, to.col) + 1
        const colEnd = Math.max(from.col, to.col) + (colGap === 1 ? 1 : 0)
        if (colStart >= colEnd) continue

        arrow.style.gridRow = String(from.tier)
        arrow.style.gridColumn = `${colStart} / ${colEnd}`

        if (Number.isFinite(link.bleedLeft)) {
          arrow.style.setProperty("--arrow-bleed-left", `${link.bleedLeft}px`)
        }
        if (Number.isFinite(link.bleedRight)) {
          arrow.style.setProperty("--arrow-bleed-right", `${link.bleedRight}px`)
        }
        if (link.offsetX) {
          arrow.style.setProperty("--arrow-offset-x", link.offsetX)
        }
      }

      arrow.style.setProperty("--arrow-asset", `url("${link.asset}")`)
      if (link.width) arrow.style.setProperty("--arrow-width", `${link.width}px`)
      if (link.height) arrow.style.setProperty("--arrow-height", `${link.height}px`)
      if (Number.isFinite(link.bleedTop)) {
        arrow.style.setProperty("--arrow-bleed-top", `${link.bleedTop}px`)
      }
      if (Number.isFinite(link.bleedBottom)) {
        arrow.style.setProperty("--arrow-bleed-bottom", `${link.bleedBottom}px`)
      }
      if (link.offsetY) arrow.style.setProperty("--arrow-offset", link.offsetY)

      arrowLayer.appendChild(arrow)
      arrowEls.push({
        el: arrow,
        fromId: from.id,
        toId: to.id,
        baseAsset: link.asset,
        activeAsset: link.activeAsset || null,
        requireMax: Boolean(link.requireMax),
      })
    }
  }

  const nodeEls = {}

  for (let tier = 1; tier <= TALENT_DATA.tiers; tier++) {
    for (let col = 1; col <= TALENT_DATA.cols; col++) {
      const cell = el("div", "talent_cell")
      const n = coordMap[`${tier}:${col}`]
      if (n) {
        const btn = el("button", "talent_node")
        btn.type = "button"
        btn.dataset.id = n.id
        btn.setAttribute("aria-label", n.name)

        const icon = el("div", "talent_icon")
        const fallbackText = n.name
          .split(" ")
          .slice(0, 2)
          .map((p) => p[0] || "")
          .join("")
          .toUpperCase()

        const iconImg = el("img", "talent_icon_img")
        iconImg.alt = n.name
        iconImg.loading = "lazy"
        iconImg.decoding = "async"
        if (n.icon) iconImg.src = n.icon

        const iconFallback = el("span", "talent_icon_fallback", fallbackText)
        icon.append(iconImg, iconFallback)

        if (n.icon) {
          iconImg.addEventListener("load", () => icon.classList.add("is_loaded"))
          iconImg.addEventListener("error", () => icon.classList.add("is_missing"))
        } else {
          icon.classList.add("is_missing")
        }

        const rank = el("div", "talent_rank", `0/${n.max}`)

        btn.append(icon, rank)
        cell.appendChild(btn)
        nodeEls[n.id] = { btn, rank, cell }
      } else {
        cell.classList.add("talent_cell_empty")
      }
      grid.appendChild(cell)
    }
  }

  panel.append(header, grid)
  return { panel, nodeEls, arrows: arrowEls, pointsEl: points }
}

  for (const tree of TALENT_DATA.trees) {
    const ui = makeTree(tree)
    treesRow.appendChild(ui.panel)
    treeUIs[tree.key] = ui
  }

  // Right side: presets and details
  const presetsCard = el("div", "talent_card")
  const presetsTitle = el("div", "talent_card_title", "Build presets")

  const presetRow = el("div", "talent_preset_row")
  const presetSelect = el("select", "talent_select")
  for (const p of PRESETS) {
    const opt = el("option", null, p.label)
    opt.value = p.key
    presetSelect.appendChild(opt)
  }
  const presetHint = el("div", "talent_hint", "Replace this with your real builds")
  presetRow.append(presetSelect, presetHint)

  const presetBtns = el("div", "talent_button_row")
  const btnReset = el("button", "talent_btn", "Reset")
  btnReset.type = "button"
  const btnCopy = el("button", "talent_btn talent_btn_primary", "Copy link")
  btnCopy.type = "button"
  presetBtns.append(btnReset, btnCopy)

  presetsCard.append(presetsTitle, presetRow, presetBtns)

  const detailCard = el("div", "talent_card")
  const detailTitle = el("div", "talent_card_title", "Talent details")

  const detailName = el("div", "talent_detail_name", "Select a talent")
  const detailMeta = el("div", "talent_detail_meta", " ")
  const detailWhyTitle = el("div", "talent_detail_subtitle", "Why we take it")
  const detailWhy = el(
    "div",
    "talent_detail_body",
    "This is where the guide becomes better than a normal calculator."
  )

  const detailRules = el(
    "div",
    "talent_detail_rules",
    "Click adds points. Right click removes points. Locked talents require tier points and any prerequisites."
  )

  detailCard.append(detailTitle, detailName, detailMeta, detailWhyTitle, detailWhy, detailRules)
  right.append(presetsCard, detailCard)

  left.appendChild(treesRow)
  layout.append(left, right)
  wrap.append(top, layout)
  root.appendChild(wrap)

  const tooltipHost = document.body || document.documentElement
  let tooltip = tooltipHost.querySelector(".talent_tooltip[data-talent-tooltip='1']")
  if (!tooltip) {
    tooltip = el("div", "talent_tooltip")
    tooltip.dataset.talentTooltip = "1"
    tooltipHost.appendChild(tooltip)
  }
  tooltip.setAttribute("role", "tooltip")
  tooltip.setAttribute("aria-hidden", "true")
  tooltip.classList.remove("is_visible")
  tooltip.style.transform = "translate(-9999px, -9999px)"

  const tooltipState = {
    id: null,
    anchor: null,
    lastX: null,
    lastY: null,
  }

  function tooltipHtmlFor(id) {
    const n = idx.byId[id]
    if (!n) return ""
    const list = TALENT_TOOLTIP_MAP.get(n.name.toLowerCase())
    if (!list || !list.length) return ""
    const points = state.ranks[id] || 0
    const index = Math.min(Math.max(points, 0), list.length - 1)
    let html = list[index] || ""
    if (!html) return ""

    // Replace the trailing "Click to learn" row with requirements when you cannot add
    if (html.includes("Click to learn")) {
      if (canAdd(id)) {
        // leave as is
      } else {
        const reasons = cannotAddReasons(id)
        const rows = (reasons.length ? reasons : ["Cannot learn this talent yet"])
          .map((t) => `<tr><td class='tooltip-red'>${t}</td></tr>`)
          .join("")

        html = html.replace(
          /<tr><td class='tooltip-green'>Click to learn<\/td><\/tr>/g,
          rows
        )
      }
    }
    return html
  }

  function positionTooltip(ev, anchorEl) {
    if (ev && Number.isFinite(ev.clientX)) {
      tooltipState.lastX = ev.clientX
      tooltipState.lastY = ev.clientY
    }

    const anchor = anchorEl || tooltipState.anchor
    let x = tooltipState.lastX
    let y = tooltipState.lastY
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      if (anchor) {
        const rect = anchor.getBoundingClientRect()
        x = rect.right + 8
        y = rect.top + rect.height / 2
      } else {
        x = 0
        y = 0
      }
    }

    const rect = tooltip.getBoundingClientRect()
    const pad = 12
    let left = x + 14
    let top = y + 14

    if (left + rect.width > window.innerWidth - pad) left = x - rect.width - 14
    if (top + rect.height > window.innerHeight - pad) top = y - rect.height - 14

    left = Math.max(pad, Math.min(left, window.innerWidth - rect.width - pad))
    top = Math.max(pad, Math.min(top, window.innerHeight - rect.height - pad))

    tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
  }

  function showTooltip(id, ev, anchorEl) {
    const html = tooltipHtmlFor(id)
    if (!html) {
      hideTooltip()
      return
    }

    tooltipState.id = id
    tooltipState.anchor = anchorEl || tooltipState.anchor
    tooltip.innerHTML = html
    tooltip.classList.add("is_visible")
    tooltip.setAttribute("aria-hidden", "false")
    positionTooltip(ev, anchorEl)
  }

  function hideTooltip() {
    tooltipState.id = null
    tooltipState.anchor = null
    tooltipState.lastX = null
    tooltipState.lastY = null
    tooltip.classList.remove("is_visible")
    tooltip.setAttribute("aria-hidden", "true")
    tooltip.style.transform = "translate(-9999px, -9999px)"
  }

  function refreshTooltip() {
    if (!tooltipState.id) return
    const html = tooltipHtmlFor(tooltipState.id)
    if (!html) {
      hideTooltip()
      return
    }
    tooltip.innerHTML = html
    positionTooltip(null, tooltipState.anchor)
  }

  function setSelected(id) {
    state.selected = id
    for (const k in idx.byId) {
      const n = idx.byId[k]
      const ui = treeUIs[n.tree]
      const e = ui.nodeEls[n.id]
      if (!e) continue
      e.btn.classList.toggle("is_selected", n.id === id)
    }

    if (!id || !idx.byId[id]) {
      detailName.textContent = "Select a talent"
      detailMeta.textContent = " "
      return
    }

    const n = idx.byId[id]
    const r = state.ranks[id] || 0
    detailName.textContent = n.name
    detailMeta.textContent = `${n.tree_label} tier ${n.tier}  Rank ${r} of ${n.max}`
  }

  function canAdd(id) {
    const n = idx.byId[id]
    if (!n) return false

    const current = state.ranks[id] || 0
    if (current >= n.max) return false

    const total = sumAllPoints(state.ranks)
    if (total >= TALENT_DATA.total_points) return false

    if (!tierUnlocked(state.ranks, n.tree, n.tier, idx)) return false

    if (!prereqMet(state.ranks, n, idx)) return false

    return true
  }

  function canRemove(id) {
    const cur = state.ranks[id] || 0
    if (cur <= 0) return false

    const next = { ...state.ranks, [id]: cur - 1 }
    if (next[id] === 0) delete next[id]
    return validateAll(next, TALENT_DATA, idx)
  }

  function addPoint(id) {
    if (!canAdd(id)) return
    state.ranks[id] = (state.ranks[id] || 0) + 1
    syncUI()
  }


  function removePoint(id) {
    if (!canRemove(id)) return
    state.ranks[id] = (state.ranks[id] || 0) - 1
    if (state.ranks[id] <= 0) delete state.ranks[id]
    syncUI()
  }

  function treeLabel(treeKey) {
    const t = TALENT_DATA.trees.find((x) => x.key === treeKey)
    return t ? t.label : treeKey
  }

function cannotAddReasons(id) {
  const n = idx.byId[id]
  if (!n) return []

  const reasons = []
  const current = state.ranks[id] || 0

  // Maxed
  if (current >= n.max) {
    reasons.push("Already at max rank")
    return reasons
  }

  // No points remaining overall
  const total = sumAllPoints(state.ranks)
  if (total >= TALENT_DATA.total_points) {
    reasons.push("No talent points remaining")
  }

  const prev = pointsInPreviousTiers(state.ranks, n.tree, n.tier, idx)
  const needed = n.tier <= 1 ? 0 : (n.tier - 1) * 5
  if (prev < needed) {
    reasons.push(`Requires ${needed} points in previous tiers of ${treeLabel(n.tree)} Talents`)
  }

  // Prereq talent not learned
  if (n.req_id) {
    const reqNode = idx.byId[n.req_id]
    const reqName = reqNode ? reqNode.name : n.req_name
    const needed = reqNode ? reqNode.max : 1
    const have = state.ranks[n.req_id] || 0

    if (have < needed) {
      reasons.push(`Requires ${needed} point${needed === 1 ? "" : "s"} in ${reqName}`)
    }
  }
  return reasons
}

  function syncUI() {
    const total = sumAllPoints(state.ranks)
    const atCap = total >= TALENT_DATA.total_points
    totalPtsVal.textContent = `${total} of ${TALENT_DATA.total_points}`

    const treePointsByKey = {}
    for (const tree of TALENT_DATA.trees) {
      const tp = sumPoints(state.ranks, tree.key, idx)
      treePointsByKey[tree.key] = tp
      treeTotalsEls[tree.key].textContent = String(tp)
      if (treeUIs && treeUIs[tree.key] && treeUIs[tree.key].pointsEl) {
        treeUIs[tree.key].pointsEl.textContent = String(tp)
      }
    }

    for (const id in idx.byId) {
      const n = idx.byId[id]
      const ui = treeUIs[n.tree]
      const e = ui.nodeEls[id]
      if (!e) continue

      const r = state.ranks[id] || 0
      e.rank.textContent = `${r}/${n.max}`

      const locked = !tierUnlocked(state.ranks, n.tree, n.tier, idx) || !prereqMet(state.ranks, n, idx)
      const full = r >= n.max
      const capped = atCap && r === 0

      e.btn.classList.toggle("is_locked", locked && r === 0)
      e.btn.classList.toggle("is_spent", r > 0)
      e.btn.classList.toggle("is_full", full)
      e.btn.classList.toggle("is_capped", capped)
      e.btn.disabled = locked && r === 0
    }

    for (const tree of TALENT_DATA.trees) {
      const ui = treeUIs[tree.key]
      if (!ui.arrows || ui.arrows.length === 0) continue
      const treePoints = treePointsByKey[tree.key] || 0

      for (const arrow of ui.arrows) {
        const fromNode = idx.byId[arrow.fromId]
        const toNode = idx.byId[arrow.toId]
        if (!fromNode || !toNode) continue

        const fromRank = state.ranks[arrow.fromId] || 0
        const toRank = state.ranks[arrow.toId] || 0
        const required = arrow.requireMax ? fromNode.max : 1
        const isReady = fromRank >= required && tierUnlocked(state.ranks, toNode.tree, toNode.tier, idx)
        const canSpend = toRank > 0 || (!atCap && canAdd(arrow.toId))
        const isActive = isReady && canSpend
        const asset = isActive && arrow.activeAsset ? arrow.activeAsset : arrow.baseAsset
        if (asset) arrow.el.style.setProperty("--arrow-asset", `url("${asset}")`)
        arrow.el.classList.toggle("is_active", isActive)
      }
    }

    setSelected(state.selected)
    refreshTooltip()

    // Keep URL in sync (no forced navigation)
    try {
      const url = new URL(window.location.href)
      const ser = serializeBuild(state.ranks, TALENT_DATA, idx)
      url.searchParams.set("talents", ser)
      window.history.replaceState({}, "", url.toString())
    } catch (_) {}
  }

  // Wire events for nodes
  for (const tree of TALENT_DATA.trees) {
    const ui = treeUIs[tree.key]
    for (const id in ui.nodeEls) {
      const { btn, cell } = ui.nodeEls[id]
      const hoverTarget = cell || btn

      hoverTarget.addEventListener("mouseenter", (ev) => {
        showTooltip(id, ev, hoverTarget)
      })

      hoverTarget.addEventListener("mousemove", (ev) => {
        if (tooltipState.id === id) positionTooltip(ev, hoverTarget)
      })

      hoverTarget.addEventListener("mouseleave", () => {
        if (tooltipState.id === id) hideTooltip()
      })

      btn.addEventListener("focus", () => {
        showTooltip(id, null, btn)
      })

      btn.addEventListener("blur", () => {
        if (tooltipState.id === id) hideTooltip()
      })

      btn.addEventListener("click", () => {
        setSelected(id)
        addPoint(id)
      })

      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault()
        setSelected(id)
        removePoint(id)
      })
    }
  }

  // Presets
  presetSelect.addEventListener("change", () => {
    const key = presetSelect.value
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    state.ranks = p.apply(state.ranks, TALENT_DATA, idx)
    syncUI()
  })

  btnReset.addEventListener("click", () => {
    state.ranks = {}
    state.selected = null
    syncUI()
  })

  btnCopy.addEventListener("click", async () => {
    const ser = serializeBuild(state.ranks, TALENT_DATA, idx)

    const url = new URL("/guide/talents", window.location.origin)
    url.searchParams.set("talents", ser)

    try {
      await navigator.clipboard.writeText(url.toString())
      btnCopy.textContent = "Copied"
      window.setTimeout(() => (btnCopy.textContent = "Copy link"), 900)
    } catch (_) {
      // Fallback
      const tmp = el("input")
      tmp.value = url.toString()
      document.body.appendChild(tmp)
      tmp.select()
      document.execCommand("copy")
      tmp.remove()
      btnCopy.textContent = "Copied"
      window.setTimeout(() => (btnCopy.textContent = "Copy link"), 900)
    }
  })

  // First paint
  syncUI()
}
