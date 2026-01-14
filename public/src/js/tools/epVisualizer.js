// /src/js/labs/epVisualizer.js
const EPVIS_CSS_HREF = "/src/css/labs/epVisualizer.css"

const HIT_RATING_PER_PERCENT = 15.8
const EXP_RATING_PER_SKILL = 3.94

const STORAGE_KEY = "epVis_state_v1"

const PRESETS = {
  pre: {
    label: "Pre raid",
    weights: {
      strength: 2.2,
      agility: 1.339,
      hitRating: 1.572,
      expertiseRating: 2.706,
      hasteRating: 1.847,
      critRating: 1.379,
      armorPen: 0.257,
      spellDamage: 0.455,
      spellHitRating: 0.805,
      spellCritRating: 0.191,
      intellect: 0.078,
      spirit: 0.05,
    },
  },
  t4: {
    label: "Tier 4",
    weights: {
      strength: 2.2,
      agility: 1.403,
      hitRating: 1.655,
      expertiseRating: 2.847,
      hasteRating: 1.873,
      critRating: 1.445,
      armorPen: 0.27,
      spellDamage: 0.461,
      spellHitRating: 0.853,
      spellCritRating: 0.21,
      intellect: 0.085,
      spirit: 0.051,
    },
  },
  t5: {
    label: "Tier 5",
    weights: {
      strength: 2.2,
      agility: 1.317,
      hitRating: 1.665,
      expertiseRating: 2.871,
      hasteRating: 1.944,
      critRating: 1.357,
      armorPen: 0.283,
      spellDamage: 0.433,
      spellHitRating: 0.802,
      spellCritRating: 0.191,
      intellect: 0.078,
      spirit: 0.048,
    },
  },
  t6: {
    label: "Tier 6",
    weights: {
      strength: 2.2,
      agility: 1.357,
      hitRating: 1.772,
      expertiseRating: 3.105,
      hasteRating: 2.022,
      critRating: 1.398,
      armorPen: 0.302,
      spellDamage: 0.427,
      spellHitRating: 0.814,
      spellCritRating: 0.193,
      intellect: 0.079,
      spirit: 0.047,
    },
  },
  sw: {
    label: "Sunwell",
    weights: {
      strength: 2.2,
      agility: 1.545,
      hitRating: 1.855,
      expertiseRating: 3.228,
      hasteRating: 2.16,
      critRating: 1.591,
      armorPen: 0.374,
      spellDamage: 0.373,
      spellHitRating: 0.738,
      spellCritRating: 0.175,
      intellect: 0.072,
      spirit: 0.041,
    },
  },
}

const STAT_ORDER = [
  "strength",
  "agility",
  "hitRating",
  "expertiseRating",
  "hasteRating",
  "critRating",
  "armorPen",
  "spellDamage",
  "spellHitRating",
  "spellCritRating",
  "intellect",
  "spirit",
]

const STAT_META = {
  strength: { label: "Strength", unit: "points", icon: "/assets/icons/stats/strength.png" },
  agility: { label: "Agility", unit: "points", icon: "/assets/icons/stats/agility.png" },
  hitRating: { label: "Melee Hit Rating", unit: "rating", icon: "/assets/icons/stats/hit.png", capType: "hit" },
  expertiseRating: { label: "Expertise Rating", unit: "rating", icon: "/assets/icons/stats/expertise.png", capType: "exp" },
  hasteRating: { label: "Haste Rating", unit: "rating", icon: "/assets/icons/stats/haste.png" },
  critRating: { label: "Crit Rating", unit: "rating", icon: "/assets/icons/stats/crit.png" },
  armorPen: { label: "Armor Pen", unit: "rating", icon: "/assets/icons/stats/armorpen.png" },
  spellDamage: { label: "Spell Power", unit: "points", icon: "/assets/icons/stats/spellpower.png" },
  spellHitRating: { label: "Spell Hit Rating", unit: "rating", icon: "/assets/icons/stats/spellhit.png" },
  spellCritRating: { label: "Spell Crit Rating", unit: "rating", icon: "/assets/icons/stats/spellcrit.png" },
  intellect: { label: "Intellect", unit: "points", icon: "/assets/icons/stats/intellect.png" },
  spirit: { label: "Spirit", unit: "points", icon: "/assets/icons/stats/spirit.png" },
}

function ensureEpVisCss() {
  if (document.querySelector('link[data-epvis-css="1"]')) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = EPVIS_CSS_HREF
  link.dataset.epvisCss = "1"
  document.head.appendChild(link)
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function n(v, fallback = 0) {
  const x = Number(v)
  return Number.isFinite(x) ? x : fallback
}

function fmt(v, digits = 3) {
  const x = Number(v)
  if (!Number.isFinite(x)) return (0).toFixed(digits)
  return x.toFixed(digits)
}

function fmtSigned(v, digits = 2) {
  const x = Number(v)
  if (!Number.isFinite(x)) return "+0.00"
  const s = x >= 0 ? "+" : ""
  return s + x.toFixed(digits)
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== "object") return null
    return obj
  } catch {
    return null
  }
}

function writeStoredState(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // ignore
  }
}

function capRatingFromPct(pct) {
  return pct * HIT_RATING_PER_PERCENT
}

function capRatingFromExpSkill(skill) {
  return skill * EXP_RATING_PER_SKILL
}

// Integral of a piecewise constant weight function split at cap
function piecewiseIntegral(a, b, cap, wPre, wPost) {
  if (a === b) return 0
  if (a < cap && b <= cap) return (b - a) * wPre
  if (a < cap && b > cap) return (cap - a) * wPre + (b - cap) * wPost
  if (a >= cap && b >= cap) return (b - a) * wPost
  // a >= cap and b < cap
  return (cap - a) * wPost + (b - cap) * wPre
}

function splitDelta(a, b, cap) {
  if (a === b) return { below: 0, above: 0 }
  if (a < cap && b <= cap) return { below: b - a, above: 0 }
  if (a < cap && b > cap) return { below: cap - a, above: b - cap }
  if (a >= cap && b >= cap) return { below: 0, above: b - a }
  // a >= cap and b < cap
  return { below: b - cap, above: cap - a }
}

function makeWeightsText(weights) {
  const ordered = {}
  for (const k of STAT_ORDER) {
    if (k in weights) ordered[k] = Number(weights[k])
  }
  for (const k of Object.keys(weights || {})) {
    if (!(k in ordered)) ordered[k] = weights[k]
  }
  return JSON.stringify(ordered, null, 2)
}

function normalizeWeights(obj) {
  const out = {}
  if (!obj || typeof obj !== "object") return out
  for (const k of Object.keys(obj)) {
    out[k] = n(obj[k], 0)
  }
  return out
}

function weightsForPreset(key) {
  if (!key || !PRESETS[key]) return PRESETS.t6.weights
  return PRESETS[key].weights
}

function buildPresetOptions() {
  const opts = []
  for (const key of Object.keys(PRESETS)) {
    opts.push({ key, label: PRESETS[key].label })
  }
  return opts
}

function buildStatOptions() {
  return STAT_ORDER.map((k) => ({ key: k, label: STAT_META[k]?.label || k }))
}

function computeEffective(state, weights) {
  const statKey = state.statKey
  const baseW = n(weights[statKey], 0)
  const cur = n(state.current, 0)
  const delta = n(state.delta, 0)
  const next = cur + delta

  const capType = STAT_META[statKey]?.capType || null

  if (capType === "hit") {
    const capPct = n(state.hitCapPct, 9)
    const cap = capRatingFromPct(capPct)
    const postMult = clamp(n(state.hitPostMult, 0.35), 0, 1)
    const wPre = baseW
    const wPost = baseW * postMult

    const ep = piecewiseIntegral(cur, next, cap, wPre, wPost)
    const eff = delta === 0 ? (cur < cap ? wPre : wPost) : ep / delta
    const split = splitDelta(cur, next, cap)

    return {
      baseW,
      effectiveW: eff,
      epChange: ep,
      split,
      cap,
      capLabel: `${fmt(capPct, 2)}% = ${fmt(cap, 1)} rating`,
      wPre,
      wPost,
      cur,
      next,
      capType,
    }
  }

  if (capType === "exp") {
    const capSkill = n(state.expCapSkill, 26)
    const cap = capRatingFromExpSkill(capSkill)
    const postMult = clamp(n(state.expPostMult, 0.2), 0, 1)
    const wPre = baseW
    const wPost = baseW * postMult

    const ep = piecewiseIntegral(cur, next, cap, wPre, wPost)
    const eff = delta === 0 ? (cur < cap ? wPre : wPost) : ep / delta
    const split = splitDelta(cur, next, cap)

    return {
      baseW,
      effectiveW: eff,
      epChange: ep,
      split,
      cap,
      capLabel: `${fmt(capSkill, 1)} expertise = ${fmt(cap, 1)} rating`,
      wPre,
      wPost,
      cur,
      next,
      capType,
    }
  }

  return {
    baseW,
    effectiveW: baseW,
    epChange: delta * baseW,
    split: { below: delta, above: 0 },
    cap: null,
    capLabel: "",
    wPre: baseW,
    wPost: baseW,
    cur,
    next,
    capType: null,
  }
}

function setText(el, text) {
  if (!el) return
  el.textContent = text
}

function setHtml(el, html) {
  if (!el) return
  el.innerHTML = html
}

function setVisible(el, on) {
  if (!el) return
  el.style.display = on ? "" : "none"
}

function buildWeightsTableHtml(primary, compare, showCompare) {
  const rows = []
  for (const k of STAT_ORDER) {
    const meta = STAT_META[k] || { label: k, icon: "" }
    const a = n(primary[k], 0)
    const b = showCompare ? n(compare?.[k], 0) : 0
    const d = showCompare ? b - a : 0

    const maxBar = showCompare ? Math.max(a, b, 0.0001) : Math.max(a, 0.0001)
    const aP = clamp((a / maxBar) * 100, 0, 100)
    const bP = clamp((b / maxBar) * 100, 0, 100)

    rows.push(`
      <tr>
        <td class="epVisStatCell">
          <span class="epVisStatIcon">
            <img src="${meta.icon}" alt="" loading="lazy" decoding="async" />
          </span>
          <span class="epVisStatLabel">${meta.label}</span>
        </td>
        <td class="epVisNum">${fmt(a, 3)}</td>
        ${
          showCompare
            ? `<td class="epVisNum epVisNumCompare">${fmt(b, 3)}</td>
               <td class="epVisNum epVisNumDiff">${fmtSigned(d, 3)}</td>`
            : ""
        }
        <td class="epVisVizCell">
          <div class="epVisMiniBar" aria-hidden="true">
            <div class="epVisMiniFill epVisMiniFillA" style="width:${aP}%"></div>
            ${showCompare ? `<div class="epVisMiniFill epVisMiniFillB" style="width:${bP}%"></div>` : ""}
          </div>
        </td>
      </tr>
    `)
  }

  return `
    <table class="epVisTable" aria-label="EP weights table">
      <thead>
        <tr>
          <th>Stat</th>
          <th>Active</th>
          ${showCompare ? "<th>Compare</th><th>Delta</th>" : ""}
          <th>Visual</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  `
}

function defaultState() {
  return {
    presetKey: "t6",
    compareKey: "",
    statKey: "hitRating",

    current: 120,
    delta: 40,

    hitCapPct: 9,
    expCapSkill: 26,

    hitPostMult: 0.35,
    expPostMult: 0.2,

    customText: "",
    customApplied: false,
  }
}

export function mountEpVisualizer(root, options = {}) {
  if (!root) return null
  ensureEpVisCss()

  const stored = readStoredState()
  const state = { ...defaultState(), ...(stored || {}), ...(options.state || {}) }

  const presetOptions = buildPresetOptions()
  const statOptions = buildStatOptions()

  root.innerHTML = `
    <section class="contentCard epVisCard">
      <div class="eyebrow">Tool</div>
      <h2>EP Visualizer</h2>
      <p class="lead epVisLead">
        Compare EP snapshots and see how cap thresholds change the effective value of Hit and Expertise.
      </p>

      <div class="epVisGrid">
        <div class="epVisPanel epVisPanelControls">
          <div class="epVisPanelTitle">Inputs</div>

          <div class="epVisField">
            <label class="epVisLabel" for="epVisPreset">Context</label>
            <select class="epVisSelect" id="epVisPreset" data-bind="preset">
              ${presetOptions.map((o) => `<option value="${o.key}">${o.label}</option>`).join("")}
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="epVisField">
            <label class="epVisLabel" for="epVisCompare">Compare to</label>
            <select class="epVisSelect" id="epVisCompare" data-bind="compare">
              <option value="">None</option>
              ${presetOptions.map((o) => `<option value="${o.key}">${o.label}</option>`).join("")}
            </select>
            <div class="epVisHint">Comparison only changes the table, not the cap math panel.</div>
          </div>

          <div class="epVisDivider"></div>

          <div class="epVisField">
            <label class="epVisLabel" for="epVisStat">Stat under test</label>
            <select class="epVisSelect" id="epVisStat" data-bind="stat">
              ${statOptions.map((o) => `<option value="${o.key}">${o.label}</option>`).join("")}
            </select>
          </div>

          <div class="epVisTwoCol">
            <div class="epVisField">
              <label class="epVisLabel" for="epVisCurrent">Current value</label>
              <input class="epVisInput" id="epVisCurrent" data-bind="current" type="number" step="1" min="0" />
              <div class="epVisHint" data-bind="currentHint"></div>
            </div>

            <div class="epVisField">
              <label class="epVisLabel" for="epVisDelta">Delta</label>
              <input class="epVisInput" id="epVisDelta" data-bind="delta" type="number" step="1" />
              <div class="epVisHint">Positive adds stat, negative removes stat.</div>
            </div>
          </div>

          <div class="epVisField">
            <label class="epVisLabel">Delta slider</label>
            <input class="epVisRange" data-bind="deltaRange" type="range" min="-200" max="200" step="1" />
            <div class="epVisRangeRow">
              <span class="epVisRangeSmall" data-bind="deltaLeft">-200</span>
              <span class="epVisRangeValue"><strong data-bind="deltaShow">0</strong></span>
              <span class="epVisRangeSmall" data-bind="deltaRight">200</span>
            </div>
          </div>

          <div class="epVisCapBox" data-bind="capBox">
            <div class="epVisCapTitle">Cap behavior</div>

            <div class="epVisCapRow" data-bind="hitCapRow">
              <div class="epVisField">
                <label class="epVisLabel" for="epVisHitCapPct">Hit cap percent</label>
                <input class="epVisInput" id="epVisHitCapPct" data-bind="hitCapPct" type="number" step="0.1" min="0" />
                <div class="epVisHint" data-bind="hitCapHint"></div>
              </div>

              <div class="epVisField">
                <label class="epVisLabel" for="epVisHitPostMult">Post cap multiplier</label>
                <input class="epVisInput" id="epVisHitPostMult" data-bind="hitPostMult" type="number" step="0.05" min="0" max="1" />
                <div class="epVisHint">Fraction of the pre cap value after you cross the cap.</div>
              </div>
            </div>

            <div class="epVisCapRow" data-bind="expCapRow">
              <div class="epVisField">
                <label class="epVisLabel" for="epVisExpCapSkill">Expertise cap</label>
                <input class="epVisInput" id="epVisExpCapSkill" data-bind="expCapSkill" type="number" step="1" min="0" />
                <div class="epVisHint" data-bind="expCapHint"></div>
              </div>

              <div class="epVisField">
                <label class="epVisLabel" for="epVisExpPostMult">Post cap multiplier</label>
                <input class="epVisInput" id="epVisExpPostMult" data-bind="expPostMult" type="number" step="0.05" min="0" max="1" />
                <div class="epVisHint">Fraction of the pre cap value after you cross the cap.</div>
              </div>
            </div>
          </div>

          <details class="epVisDetails" data-bind="customDetails">
            <summary>Custom weights JSON</summary>
            <div class="epVisDetailsBody">
              <div class="epVisHint">
                Paste an object with keys like strength, hitRating, expertiseRating, hasteRating. Missing keys default to 0.
              </div>
              <textarea class="epVisTextarea" data-bind="customText" spellcheck="false"></textarea>

              <div class="epVisBtnRow">
                <button class="btn" type="button" data-act="applyCustom">Apply</button>
                <button class="btn btnGhost" type="button" data-act="usePreset">Use preset</button>
                <button class="btn btnGhost" type="button" data-act="copyJson">Copy active JSON</button>
              </div>

              <div class="epVisError" data-bind="customError" role="status" aria-live="polite"></div>
            </div>
          </details>
        </div>

        <div class="epVisPanel epVisPanelResults">
          <div class="epVisPanelTitle">Output</div>

          <div class="epVisBigRow">
            <div class="epVisBig">
              <div class="epVisBigLabel">Effective EP per point</div>
              <div class="epVisBigValue" data-bind="effW">0.000</div>
              <div class="epVisBigSub" data-bind="effNote"></div>
            </div>

            <div class="epVisBig">
              <div class="epVisBigLabel">EP change for delta</div>
              <div class="epVisBigValue" data-bind="epChange">+0.00</div>
              <div class="epVisBigSub" data-bind="epSplit"></div>
            </div>
          </div>

          <div class="epVisVizCard">
            <div class="epVisVizTitle">Cap lane</div>
            <div class="epVisLane" role="img" aria-label="Cap visualization lane">
              <div class="epVisLaneSeg epVisLaneSegPre" data-bind="lanePre"></div>
              <div class="epVisLaneSeg epVisLaneSegPost" data-bind="lanePost"></div>
              <div class="epVisLaneCap" data-bind="laneCap"></div>
              <div class="epVisLaneMarker epVisLaneMarkerCur" data-bind="laneCur" title="Current"></div>
              <div class="epVisLaneMarker epVisLaneMarkerNext" data-bind="laneNext" title="After delta"></div>
            </div>
            <div class="epVisLaneLegend" data-bind="laneLegend"></div>
          </div>

          <div class="epVisTableShell">
            <div class="epVisTableTop">
              <div class="epVisTableTitle">Weights snapshot</div>
              <div class="epVisTableBtns">
                <button class="btn btnGhost epVisSmallBtn" type="button" data-act="copyJsonTop">Copy JSON</button>
              </div>
            </div>
            <div class="epVisTableWrap" data-bind="tableWrap"></div>
          </div>

          <div class="epVisNote">
            This tool shows why weights are not universal. If you want exact answers, sim your character and treat these as intuition training.
          </div>
        </div>
      </div>
    </section>
  `

  const ui = {
    preset: root.querySelector('[data-bind="preset"]'),
    compare: root.querySelector('[data-bind="compare"]'),
    stat: root.querySelector('[data-bind="stat"]'),

    current: root.querySelector('[data-bind="current"]'),
    delta: root.querySelector('[data-bind="delta"]'),
    deltaRange: root.querySelector('[data-bind="deltaRange"]'),
    deltaShow: root.querySelector('[data-bind="deltaShow"]'),
    currentHint: root.querySelector('[data-bind="currentHint"]'),

    capBox: root.querySelector('[data-bind="capBox"]'),
    hitCapRow: root.querySelector('[data-bind="hitCapRow"]'),
    expCapRow: root.querySelector('[data-bind="expCapRow"]'),

    hitCapPct: root.querySelector('[data-bind="hitCapPct"]'),
    hitPostMult: root.querySelector('[data-bind="hitPostMult"]'),
    hitCapHint: root.querySelector('[data-bind="hitCapHint"]'),

    expCapSkill: root.querySelector('[data-bind="expCapSkill"]'),
    expPostMult: root.querySelector('[data-bind="expPostMult"]'),
    expCapHint: root.querySelector('[data-bind="expCapHint"]'),

    customDetails: root.querySelector('[data-bind="customDetails"]'),
    customText: root.querySelector('[data-bind="customText"]'),
    customError: root.querySelector('[data-bind="customError"]'),

    effW: root.querySelector('[data-bind="effW"]'),
    effNote: root.querySelector('[data-bind="effNote"]'),
    epChange: root.querySelector('[data-bind="epChange"]'),
    epSplit: root.querySelector('[data-bind="epSplit"]'),

    lanePre: root.querySelector('[data-bind="lanePre"]'),
    lanePost: root.querySelector('[data-bind="lanePost"]'),
    laneCap: root.querySelector('[data-bind="laneCap"]'),
    laneCur: root.querySelector('[data-bind="laneCur"]'),
    laneNext: root.querySelector('[data-bind="laneNext"]'),
    laneLegend: root.querySelector('[data-bind="laneLegend"]'),

    tableWrap: root.querySelector('[data-bind="tableWrap"]'),
  }

  function activeWeights() {
    if (state.presetKey === "custom" && state.customApplied) {
      return normalizeWeights(safeJsonParse(state.customText) || {})
    }
    return normalizeWeights(weightsForPreset(state.presetKey))
  }

  function compareWeights() {
    if (!state.compareKey) return null
    return normalizeWeights(weightsForPreset(state.compareKey))
  }

  function syncInputsFromState() {
    if (ui.preset) ui.preset.value = state.presetKey || "t6"
    if (ui.compare) ui.compare.value = state.compareKey || ""
    if (ui.stat) ui.stat.value = state.statKey || "hitRating"

    if (ui.current) ui.current.value = String(n(state.current, 0))
    if (ui.delta) ui.delta.value = String(n(state.delta, 0))

    if (ui.deltaRange) ui.deltaRange.value = String(clamp(n(state.delta, 0), -200, 200))
    if (ui.deltaShow) ui.deltaShow.textContent = String(n(state.delta, 0))

    if (ui.hitCapPct) ui.hitCapPct.value = String(n(state.hitCapPct, 9))
    if (ui.hitPostMult) ui.hitPostMult.value = String(n(state.hitPostMult, 0.35))

    if (ui.expCapSkill) ui.expCapSkill.value = String(n(state.expCapSkill, 26))
    if (ui.expPostMult) ui.expPostMult.value = String(n(state.expPostMult, 0.2))

    if (ui.customText) ui.customText.value = state.customText || ""
  }

  function applyStatHintsAndCaps() {
    const meta = STAT_META[state.statKey] || { unit: "points" }

    setText(ui.currentHint, meta.unit === "rating" ? "Use rating on gear." : "Use raw stat points.")

    const capType = meta.capType || null
    const showCaps = capType === "hit" || capType === "exp"
    setVisible(ui.capBox, showCaps)
    setVisible(ui.hitCapRow, capType === "hit")
    setVisible(ui.expCapRow, capType === "exp")

    const hitPct = n(state.hitCapPct, 9)
    setText(ui.hitCapHint, `${fmt(capRatingFromPct(hitPct), 1)} hit rating at level 70`)

    const expSkill = n(state.expCapSkill, 26)
    setText(ui.expCapHint, `${fmt(capRatingFromExpSkill(expSkill), 1)} expertise rating at level 70`)
  }

  function renderLane(res) {
    const meta = STAT_META[state.statKey] || { unit: "points" }

    const cur = n(res.cur, 0)
    const next = n(res.next, 0)

    let maxX = 200
    if (res.capType) {
      maxX = Math.max(res.cap * 1.6, cur, next, 160)
    } else {
      maxX = Math.max(cur, next, 200)
    }
    maxX = Math.ceil(maxX / 10) * 10

    const capX = res.capType ? clamp((res.cap / maxX) * 100, 0, 100) : 100
    const curX = clamp((cur / maxX) * 100, 0, 100)
    const nextX = clamp((next / maxX) * 100, 0, 100)

    ui.lanePre.style.width = `${res.capType ? capX : 100}%`
    ui.lanePost.style.width = `${res.capType ? 100 - capX : 0}%`

    ui.laneCap.style.left = `${res.capType ? capX : 100}%`
    ui.laneCur.style.left = `${curX}%`
    ui.laneNext.style.left = `${nextX}%`

    const capText = res.capType ? `Cap: ${res.capLabel}` : "No cap logic for this stat"
    const unitText = meta.unit === "rating" ? "rating" : "points"
    setText(ui.laneLegend, `${capText}. Lane scale 0 to ${maxX} ${unitText}. Current ${fmt(cur, 1)} to ${fmt(next, 1)}.`)
  }

  function render() {
    const weights = activeWeights()
    const compare = compareWeights()
    const showCompare = Boolean(compare && state.compareKey && state.compareKey !== state.presetKey)

    const res = computeEffective(state, weights)

    setText(ui.effW, fmt(res.effectiveW, 3))

    if (res.capType === "hit") {
      setText(ui.effNote, res.cur < res.cap ? "Below cap, full value" : "Above cap, reduced value")
    } else if (res.capType === "exp") {
      setText(ui.effNote, res.cur < res.cap ? "Below cap, full value" : "Above cap, reduced value")
    } else {
      setText(ui.effNote, `Constant weight in this snapshot`)
    }

    setText(ui.epChange, fmtSigned(res.epChange, 2))

    if (res.capType) {
      const below = res.split.below
      const above = res.split.above
      const parts = []
      if (below !== 0) parts.push(`${fmtSigned(below, 1)} rating below cap`)
      if (above !== 0) parts.push(`${fmtSigned(above, 1)} rating above cap`)
      const detail = parts.length ? parts.join(", ") : "No change"
      setText(ui.epSplit, `${detail}. Pre ${fmt(res.wPre, 3)}, post ${fmt(res.wPost, 3)}.`)
    } else {
      setText(ui.epSplit, `Base weight ${fmt(res.baseW, 3)}.`)
    }

    renderLane(res)

    const tableHtml = buildWeightsTableHtml(weights, compare, showCompare)
    setHtml(ui.tableWrap, tableHtml)

    state.customApplied = state.presetKey === "custom" && Boolean(state.customApplied)
    writeStoredState(state)
  }

  function setPresetKey(key) {
    state.presetKey = key
    if (key !== "custom") {
      state.customApplied = false
    } else {
      if (!state.customText) {
        state.customText = makeWeightsText(weightsForPreset("t6"))
      }
      ui.customDetails.open = true
    }
    syncInputsFromState()
    applyStatHintsAndCaps()
    render()
  }

  function setStatKey(key) {
    state.statKey = key
    syncInputsFromState()
    applyStatHintsAndCaps()
    render()
  }

  async function copyActiveJson() {
    const weights = activeWeights()
    const text = makeWeightsText(weights)

    try {
      await navigator.clipboard.writeText(text)
      setText(ui.customError, "Copied weights JSON to clipboard.")
      ui.customError.classList.remove("isBad")
      ui.customError.classList.add("isGood")
      window.setTimeout(() => setText(ui.customError, ""), 1600)
      return
    } catch {
      // fallback
    }

    try {
      ui.customText.value = text
      ui.customDetails.open = true
      ui.customText.focus()
      ui.customText.select()
      setText(ui.customError, "Clipboard blocked. Text selected, copy manually.")
      ui.customError.classList.remove("isBad")
      ui.customError.classList.add("isGood")
      window.setTimeout(() => setText(ui.customError, ""), 2200)
    } catch {
      // ignore
    }
  }

  function applyCustomText() {
    const text = String(ui.customText.value || "").trim()
    const obj = safeJsonParse(text)
    if (!obj || typeof obj !== "object") {
      setText(ui.customError, "Invalid JSON. Paste an object like { \"strength\": 2.2, \"hitRating\": 1.77 }")
      ui.customError.classList.remove("isGood")
      ui.customError.classList.add("isBad")
      state.customApplied = false
      return
    }

    state.customText = text
    state.customApplied = true
    state.presetKey = "custom"

    setText(ui.customError, "Custom weights applied.")
    ui.customError.classList.remove("isBad")
    ui.customError.classList.add("isGood")
    window.setTimeout(() => setText(ui.customError, ""), 1600)

    syncInputsFromState()
    applyStatHintsAndCaps()
    render()
  }

  function usePresetFromSelect() {
    const key = ui.preset.value
    setPresetKey(key)
  }

  // Events
  root.addEventListener("change", (e) => {
    const t = e.target

    if (t === ui.preset) {
      setPresetKey(String(t.value || "t6"))
      return
    }

    if (t === ui.compare) {
      state.compareKey = String(t.value || "")
      render()
      return
    }

    if (t === ui.stat) {
      setStatKey(String(t.value || "hitRating"))
      return
    }

    if (t === ui.deltaRange) {
      const v = n(t.value, 0)
      state.delta = v
      if (ui.delta) ui.delta.value = String(v)
      if (ui.deltaShow) ui.deltaShow.textContent = String(v)
      render()
      return
    }
  })

  root.addEventListener("input", (e) => {
    const t = e.target

    if (t === ui.current) {
      state.current = n(t.value, 0)
      render()
      return
    }

    if (t === ui.delta) {
      state.delta = n(t.value, 0)
      if (ui.deltaRange) ui.deltaRange.value = String(clamp(n(state.delta, 0), -200, 200))
      if (ui.deltaShow) ui.deltaShow.textContent = String(n(state.delta, 0))
      render()
      return
    }

    if (t === ui.hitCapPct) {
      state.hitCapPct = n(t.value, 9)
      applyStatHintsAndCaps()
      render()
      return
    }

    if (t === ui.hitPostMult) {
      state.hitPostMult = clamp(n(t.value, 0.35), 0, 1)
      render()
      return
    }

    if (t === ui.expCapSkill) {
      state.expCapSkill = n(t.value, 26)
      applyStatHintsAndCaps()
      render()
      return
    }

    if (t === ui.expPostMult) {
      state.expPostMult = clamp(n(t.value, 0.2), 0, 1)
      render()
      return
    }
  })

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]")
    if (!btn) return

    const act = btn.dataset.act

    if (act === "applyCustom") applyCustomText()
    if (act === "usePreset") usePresetFromSelect()
    if (act === "copyJson") copyActiveJson()
    if (act === "copyJsonTop") copyActiveJson()
  })

  // Init
  syncInputsFromState()
  applyStatHintsAndCaps()

  if (!state.customText) {
    state.customText = makeWeightsText(weightsForPreset(state.presetKey || "t6"))
  }
  if (state.presetKey === "custom") {
    ui.customDetails.open = true
  }

  render()

  return {
    getState: () => ({ ...state }),
    setState: (patch) => {
      Object.assign(state, patch || {})
      syncInputsFromState()
      applyStatHintsAndCaps()
      render()
    },
  }
}

export function initEpVisualizer() {
  const root = document.getElementById("epVisualizer")
  if (!root) return null
  return mountEpVisualizer(root)
}
