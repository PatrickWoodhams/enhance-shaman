// /src/js/tools/fireTwistLab.js
import { SPELLS } from "../data/spells.js"
import { hydrateSpellRefs } from "../ui/spell_refs.js"

export function mountFireTwistLab(root) {
  // =========================================================
  // Core timings
  // =========================================================
  const GCD = 1.5

  // Fire Nova basics (trainer model)
  // Notes:
  // Fire Nova Totem is a drop that detonates after a short fuse, then the fire slot is empty
  // You replace it with a baseline fire totem (usually Searing, sometimes Magma on multi target)
  const FN_CD = 15.0
  const FN_FUSE_BASE = 4.0

  // =========================================================
  // Coaching tuning
  // =========================================================
  const EARLY_CANCEL_WINDOW = 0.8 // canceling Nova with this much fuse left is clearly wrong
  const LATE_REPLACE_WARN = 0.75 // after the burst, replace baseline quickly
  const READY_NUDGE_HOLD = 1.6
  const BURST_NUDGE_AT = 1.2 // when fuse is low, show a get ready message

  // Simple mana model
  const MANA_COST = {
    fireNova: 12,
    searing: 10,
    magma: 14,
  }

  // Default baseline rule for the trainer
  function baselineForTargets(n) {
    return n >= 3 ? "magma" : "searing"
  }

  const FIRE_MAP = {
    fireNova: { key: "fire_nova_totem", label: "Fire Nova Totem" },
    searing: { key: "searing_totem", label: "Searing Totem" },
    magma: { key: "magma_totem", label: "Magma Totem" },
    none: { key: null, label: "None" },
  }

  // =========================================================
  // State
  // =========================================================
  const state = {
    running: false,
    armed: false,
    t: 0,
    lastTick: 0,

    gcdLeft: 0,

    mana: 100,
    manaMax: 100,

    // Scenario toggles
    targetInRange: true,
    targets: 1,

    // Active
    fireActive: "none",

    // Fire Nova timers
    fnCdLeft: 0,
    fnFuseLeft: 0,
    fnFuseDuration: FN_FUSE_BASE,
    fnDroppedAt: null,
    fnBurstAt: null,

    // Metrics
    fireSlotUptime: 0,
    fireSlotEmptyTime: 0,

    baselineTime: 0,
    baselineActive: "searing",

    fnCasts: 0,
    fnBursts: 0,
    fnMissed: 0,
    fnCanceled: 0,

    wastedFnCasts: 0,

    lateReplaceCount: 0,
    lateReplaceSum: 0,

    // Game mode
    gameArmed: false,
    gameActive: false,
    gameTime: 0,
    gameBest: 0,
    gameFailed: false,
    gameFailReason: "",

    // Coach system
    coachHold: 0,
    coachLevel: "info",
    coachHtml: "",

    improvedFireTotems: 0,
    speedMultiplier: 1,
  }

  function getFnFuseDuration(points = state.improvedFireTotems) {
    if (points <= 0) return FN_FUSE_BASE
    if (points === 1) return 3.0
    return 2.0
  }

  // =========================================================
  // UI
  // =========================================================
  root.innerHTML = `
    <section class="contentCard airTwistLabCard fireTwistLabCard">
      <div class="eyebrow">Trainer</div>
      <h2>Fire Totem Twist Lab</h2>

      <div class="labRow labRowTop">
        <button class="btn" data-act="start" type="button">Start</button>
        <button class="btn btnGhost" data-act="reset" type="button">Reset</button>
        <button class="btn btnSecondary" data-act="game" type="button">Start run</button>

        <label class="labToggle" aria-label="Target in range">
          <input type="checkbox" data-act="range" checked />
          <span>Target in range</span>
        </label>

        <label class="labToggle" aria-label="Targets">
          <span class="muted">Targets</span>
          <select class="labSelect" data-act="targets">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>

        <label class="labToggle" aria-label="Improved Fire Totems">
          <span class="muted">Improved Fire Totems</span>
          <select class="labSelect" data-act="improved">
            <option value="0" selected>0</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>

        <label class="labToggle" aria-label="Simulation speed">
          <span class="muted">Sim speed</span>
          <select class="labSelect" data-act="speed">
            <option value="1" selected>100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="1.75">175%</option>
            <option value="2">200%</option>
          </select>
        </label>
      </div>

      <div class="labHud">
        <div class="labTotemCard" aria-label="Active fire totem">
          <div class="labTotemRing">
            <svg class="labRingSvg" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="labRingTrack" cx="32" cy="32" r="26" fill="none"></circle>
              <circle class="labRingProgress" cx="32" cy="32" r="26" fill="none"></circle>
              <circle class="labRingGcd" cx="32" cy="32" r="22" fill="none"></circle>
            </svg>

            <img class="labTotemIcon" data-bind="activeIcon" alt="" />
          </div>

          <div class="labTotemMeta">
            <div class="labMetaLabel">Active fire totem</div>
            <div class="labMetaValue" data-bind="activeName">None</div>

            <div class="labMiniRow">
              <div class="labMiniLabel">Fire Nova cooldown</div>
              <div class="labMiniValue"><span data-bind="fncd">0.0</span>s</div>
            </div>

            <div class="labBar" aria-label="Fire Nova cooldown bar">
              <div class="labBarFill" data-bind="fnCdBar"></div>
            </div>

            <div class="labMiniRow">
              <div class="labMiniLabel">Nova fuse</div>
              <div class="labMiniValue"><span data-bind="fuse">0.0</span>s</div>
            </div>

            <div class="labBar" aria-label="Fire Nova fuse bar">
              <div class="labBarFill" data-bind="fuseBar"></div>
            </div>

            <div class="labMiniRow">
              <div class="labMiniLabel">GCD</div>
              <div class="labMiniValue"><span data-bind="gcd">0.0</span>s</div>
            </div>

            <div class="labBar" aria-label="GCD bar">
              <div class="labBarFill" data-bind="gcdBar"></div>
            </div>

            <div class="labMiniRow">
              <div class="labMiniLabel">Mana</div>
              <div class="labMiniValue"><span data-bind="mana">100</span></div>
            </div>
          </div>
        </div>

        <div class="labCoachCard" aria-label="Coach">
          <div class="labMetaLabel">Coach</div>

          <div class="labCoachText labCoach_info" data-bind="coach" role="status" aria-live="polite">
            Press Start. Keep a baseline fire totem down. Drop Fire Nova when ready, let it burst, then replace baseline.
          </div>

          <div class="labButtons">
            <button class="btn labCastBtn" data-act="fn" type="button">
              <span class="labCastContent"><span data-spell="fire_nova_totem"></span></span>
              <span class="labBtnCd" aria-hidden="true">
                <span class="labBtnCdFill" data-bind="btnCdFn"></span>
              </span>
            </button>

            <button class="btn labCastBtn" data-act="searing" type="button">
              <span class="labCastContent"><span data-spell="searing_totem"></span></span>
              <span class="labBtnCd" aria-hidden="true">
                <span class="labBtnCdFill" data-bind="btnCdSearing"></span>
              </span>
            </button>

            <button class="btn labCastBtn" data-act="magma" type="button">
              <span class="labCastContent"><span data-spell="magma_totem"></span></span>
              <span class="labBtnCd" aria-hidden="true">
                <span class="labBtnCdFill" data-bind="btnCdMagma"></span>
              </span>
            </button>
          </div>

          <div class="labResults">
            <div><strong>Fire Nova casts:</strong> <span data-bind="fnCasts">0</span></div>
            <div><strong>Fire Nova bursts:</strong> <span data-bind="fnBursts">0</span></div>
            <div><strong>Fire Nova missed:</strong> <span data-bind="fnMissed">0</span></div>
            <div><strong>Fire Nova canceled:</strong> <span data-bind="fnCanceled">0</span></div>
            <div><strong>Late baseline replaces:</strong> <span data-bind="late">0</span></div>
            <div><strong>Fire slot uptime:</strong> <span data-bind="slotPct">0</span>%</div>
            <div><strong>Run time:</strong> <span data-bind="gameTime">0.0</span>s</div>
            <div><strong>Best run:</strong> <span data-bind="gameBest">0.0</span>s</div>
            <div><strong>Run status:</strong> <span data-bind="gameStatus">Idle</span></div>
          </div>
        </div>
      </div>
    </section>
  `

  hydrateSpellRefs(root)

  const ui = {
    // Icon area
    activeIcon: root.querySelector('[data-bind="activeIcon"]'),
    activeName: root.querySelector('[data-bind="activeName"]'),
    ringProgress: root.querySelector(".labRingProgress"),
    ringGcd: root.querySelector(".labRingGcd"),

    // Numbers
    gcd: root.querySelector('[data-bind="gcd"]'),
    mana: root.querySelector('[data-bind="mana"]'),
    fncd: root.querySelector('[data-bind="fncd"]'),
    fuse: root.querySelector('[data-bind="fuse"]'),

    // Bars
    fnCdBar: root.querySelector('[data-bind="fnCdBar"]'),
    fuseBar: root.querySelector('[data-bind="fuseBar"]'),
    gcdBar: root.querySelector('[data-bind="gcdBar"]'),

    // Coach and results
    coach: root.querySelector('[data-bind="coach"]'),
    fnCasts: root.querySelector('[data-bind="fnCasts"]'),
    fnBursts: root.querySelector('[data-bind="fnBursts"]'),
    fnMissed: root.querySelector('[data-bind="fnMissed"]'),
    fnCanceled: root.querySelector('[data-bind="fnCanceled"]'),
    late: root.querySelector('[data-bind="late"]'),
    slotPct: root.querySelector('[data-bind="slotPct"]'),
    gameTime: root.querySelector('[data-bind="gameTime"]'),
    gameBest: root.querySelector('[data-bind="gameBest"]'),
    gameStatus: root.querySelector('[data-bind="gameStatus"]'),

    // Buttons
    btnFn: root.querySelector('[data-act="fn"]'),
    btnSearing: root.querySelector('[data-act="searing"]'),
    btnMagma: root.querySelector('[data-act="magma"]'),
    btnGame: root.querySelector('[data-act="game"]'),

    improvedSelect: root.querySelector('[data-act="improved"]'),
    speedSelect: root.querySelector('[data-act="speed"]'),

    // Button overlays
    btnCdFn: root.querySelector('[data-bind="btnCdFn"]'),
    btnCdSearing: root.querySelector('[data-bind="btnCdSearing"]'),
    btnCdMagma: root.querySelector('[data-bind="btnCdMagma"]'),
  }

  // =========================================================
  // Ring setup
  // Outer ring shows Fire Nova cooldown progress (ready means full ring)
  // Inner ring shows GCD progress
  // =========================================================
  const R_OUTER = 26
  const CIRC_OUTER = 2 * Math.PI * R_OUTER
  ui.ringProgress.style.strokeDasharray = `${CIRC_OUTER} ${CIRC_OUTER}`
  ui.ringProgress.style.strokeDashoffset = `${CIRC_OUTER}`

  const R_INNER = 22
  const CIRC_INNER = 2 * Math.PI * R_INNER
  ui.ringGcd.style.strokeDasharray = `${CIRC_INNER} ${CIRC_INNER}`
  ui.ringGcd.style.strokeDashoffset = `${CIRC_INNER}`

  function setRing(el, circ, p) {
    const clamped = Math.max(0, Math.min(1, p))
    el.style.strokeDashoffset = `${circ * (1 - clamped)}`
  }

  function setBar(el, p) {
    const clamped = Math.max(0, Math.min(1, p))
    el.style.width = `${Math.round(clamped * 100)}%`
  }

  function setCdFill(el, p) {
    const clamped = Math.max(0, Math.min(1, p))
    el.style.height = `${Math.round(clamped * 100)}%`
  }

  // =========================================================
  // Coach
  // =========================================================
  function setCoach(level, html, holdSec = 2.2) {
    state.coachLevel = level
    state.coachHtml = html
    state.coachHold = holdSec
  }

  // =========================================================
  // Game mode
  // =========================================================
  function beginGameRun() {
    if (state.gameActive) return
    state.gameActive = true
    state.gameArmed = false
    state.gameFailed = false
    state.gameFailReason = ""
    state.gameTime = 0
    setCoach("info", "Run started. Keep baseline down and weave Fire Nova clean.", 2.2)
  }

  function resetRunState() {
    state.running = false
    state.armed = false
    state.t = 0
    state.lastTick = 0

    state.gcdLeft = 0
    state.mana = state.manaMax

    state.fireActive = "none"
    state.baselineActive = "searing"

    state.fnCdLeft = 0
    state.fnFuseLeft = 0
    state.fnFuseDuration = getFnFuseDuration()
    state.fnDroppedAt = null
    state.fnBurstAt = null
  }

  function startGame() {
    const restarting = state.gameActive || state.gameArmed || state.gameFailed
    if (restarting) {
      resetRunState()
    }

    if (!state.armed) start()
    state.gameArmed = true
    state.gameActive = false
    state.gameFailed = false
    state.gameFailReason = ""
    state.gameTime = 0

    if (state.running) {
      beginGameRun()
    } else {
      setCoach("info", "Run armed. First cast starts the timer.", 2.2)
    }
    render()
  }

  function failGame(reason) {
    if (!state.gameActive) return
    state.gameActive = false
    state.gameFailed = true
    state.gameFailReason = reason
    if (state.gameTime > state.gameBest) state.gameBest = state.gameTime
    setCoach("bad", `Run failed: ${reason}`, 2.6)
    state.running = false
    state.armed = false
    state.gcdLeft = 0
    render()
  }

  function defaultCoach() {
    if (!state.armed) return "Press Start. Then keep a baseline fire totem down."
    if (!state.running) return "Ready. Drop Searing or Magma as baseline, then weave Fire Nova when ready."
    if (!state.targetInRange) return "Target out of range. Fire Nova will miss. Keep baseline only."
    return "Goal: baseline up, Fire Nova on cooldown, never cancel the burst, replace baseline quickly after detonation."
  }

  function applyCoach() {
    const show = state.coachHold > 0 && state.coachHtml ? state.coachHtml : defaultCoach()
    const level = state.coachHold > 0 ? state.coachLevel : "info"
    ui.coach.className = `labCoachText labCoach_${level}`
    ui.coach.innerHTML = show
    hydrateSpellRefs(ui.coach)
  }

  // =========================================================
  // Recommendation
  // =========================================================
  function recommend() {
    if (!state.running) return "wait"
    if (state.gcdLeft > 0) return "wait"

    const base = baselineForTargets(state.targets)

    // If the slot is empty, baseline is priority
    if (state.fireActive === "none") return base

    // If Fire Nova is active, do not replace early
    if (state.fireActive === "fireNova") return "wait"

    // If Fire Nova is ready and target is in range, recommend it
    if (state.fnCdLeft <= 0 && state.targetInRange && state.mana >= MANA_COST.fireNova) return "fireNova"

    // Otherwise keep baseline correct for the target count
    if (state.fireActive !== base) return base

    return "wait"
  }

  function applyRecommendationUI(rec) {
    ui.btnFn.classList.toggle("isRecommended", rec === "fireNova")
    ui.btnSearing.classList.toggle("isRecommended", rec === "searing")
    ui.btnMagma.classList.toggle("isRecommended", rec === "magma")
  }

  // =========================================================
  // Casting rules
  // =========================================================
  function canCast(cost) {
    if (!state.armed) return false
    if (state.gcdLeft > 0) return false
    if (state.mana < cost) return false
    return true
  }

  function ensureRunning() {
    if (state.running) return
    state.running = true
    state.lastTick = performance.now()
    requestAnimationFrame(loop)
  }

  function spendMana(n) {
    state.mana = Math.max(0, state.mana - n)
  }

  function castBaseline(kind) {
    const cost = kind === "magma" ? MANA_COST.magma : MANA_COST.searing
    if (!canCast(cost)) {
      if (!state.armed) setCoach("info", "Press Start first.", 1.8)
      if (state.running && state.mana < cost) setCoach("bad", "Not enough mana for that totem.", 2.0)
      return
    }

    ensureRunning()
    let failedRun = false

    // If they replace Fire Nova before it bursts, that is a cancel
    if (state.fireActive === "fireNova" && state.fnFuseLeft > 0) {
      state.fnCanceled += 1
      if (state.fnFuseLeft >= EARLY_CANCEL_WINDOW) {
        setCoach("bad", `Too early. You canceled the burst with ${state.fnFuseLeft.toFixed(1)}s left.`, 3.0)
      } else {
        setCoach("warn", `You replaced Fire Nova before it burst. Let it detonate first.`, 2.6)
      }

      // Cancel the fuse and keep the cooldown running
      state.fnFuseLeft = 0
      state.fnDroppedAt = null
      state.fnBurstAt = null
      if (state.gameActive) {
        failGame("Canceled Fire Nova early")
        failedRun = true
      }
    } else {
      // If Fire Nova already burst and they are late, record replace delay
      if (state.fnBurstAt != null && state.fireActive === "none") {
        const delay = state.t - state.fnBurstAt
        state.fnBurstAt = null

        if (delay > LATE_REPLACE_WARN) {
          state.lateReplaceCount += 1
          state.lateReplaceSum += delay
          setCoach("warn", `Late baseline replace, ${delay.toFixed(1)}s of empty fire slot.`, 2.6)
          if (state.gameActive) {
            failGame("Late baseline replace")
            failedRun = true
          }
        } else {
          setCoach("ok", "Good. Baseline back down quickly after the burst.", 1.8)
        }
      } else {
        const name = kind === "magma" ? `<span data-spell="magma_totem"></span>` : `<span data-spell="searing_totem"></span>`
        setCoach("info", `${name} down. Weave <span data-spell="fire_nova_totem"></span> when it is ready.`, 1.8)
      }
    }

    state.gcdLeft = GCD
    spendMana(cost)

    state.fireActive = kind
    state.baselineActive = kind

    if (failedRun) {
      state.gcdLeft = 0
    }
  }

  function castFireNova() {
    const cost = MANA_COST.fireNova

    if (!canCast(cost)) {
      if (!state.armed) setCoach("info", "Press Start first.", 1.8)
      if (state.running && state.mana < cost) setCoach("bad", "Not enough mana for Fire Nova.", 2.0)
      return
    }

    // Cooldown gating
    if (state.fnCdLeft > 0) {
      state.wastedFnCasts += 1
      setCoach("warn", `Fire Nova not ready, ${state.fnCdLeft.toFixed(1)}s left.`, 2.2)
      return
    }

    // Range check
    if (!state.targetInRange) {
      setCoach("warn", "Target out of range. Fire Nova will miss. Wait for range.", 2.6)
      return
    }

    ensureRunning()

    state.fnCasts += 1
    state.gcdLeft = GCD
    spendMana(cost)

    state.fireActive = "fireNova"
    state.fnCdLeft = FN_CD
    state.fnFuseDuration = getFnFuseDuration()
    state.fnFuseLeft = state.fnFuseDuration
    state.fnDroppedAt = state.t
    state.fnBurstAt = null

    setCoach("ok", "Fire Nova down. Let it detonate, then replace baseline immediately.", 2.2)
  }

  // =========================================================
  // Start and reset
  // =========================================================
  function reset() {
    state.running = false
    state.armed = false
    state.t = 0
    state.lastTick = 0

    state.gcdLeft = 0
    state.mana = state.manaMax

    state.fireActive = "none"
    state.baselineActive = "searing"

    state.fnCdLeft = 0
    state.fnFuseLeft = 0
    const improved = ui.improvedSelect ? Number(ui.improvedSelect.value || 0) : 0
    state.improvedFireTotems = Math.max(0, Math.min(2, improved))
    state.fnFuseDuration = getFnFuseDuration()
    state.fnDroppedAt = null
    state.fnBurstAt = null

    const speed = ui.speedSelect ? Number(ui.speedSelect.value || 1) : 1
    state.speedMultiplier = Math.max(0.5, Math.min(3, speed))

    state.fireSlotUptime = 0
    state.fireSlotEmptyTime = 0
    state.baselineTime = 0

    state.fnCasts = 0
    state.fnBursts = 0
    state.fnMissed = 0
    state.fnCanceled = 0
    state.wastedFnCasts = 0

    state.lateReplaceCount = 0
    state.lateReplaceSum = 0

    state.gameArmed = false
    state.gameActive = false
    state.gameTime = 0
    state.gameBest = 0
    state.gameFailed = false
    state.gameFailReason = ""

    state.coachHold = 0
    state.coachLevel = "info"
    state.coachHtml = ""

    render()
  }

  function start() {
    if (state.armed) return
    state.armed = true
    setCoach("info", "Ready. Drop baseline first, then Fire Nova when it is ready.", 2.6)
    render()
  }

  // =========================================================
  // Tick and events
  // =========================================================
  function tick(dt) {
    state.t += dt

    if (state.gameArmed && state.running && !state.gameActive) {
      beginGameRun()
    }

    if (state.gameActive) {
      state.gameTime += dt
    }

    state.gcdLeft = Math.max(0, state.gcdLeft - dt)
    state.fnCdLeft = Math.max(0, state.fnCdLeft - dt)
    state.coachHold = Math.max(0, state.coachHold - dt)

    // Slot uptime tracking
    if (state.fireActive === "none") state.fireSlotEmptyTime += dt
    else state.fireSlotUptime += dt

    // Baseline time (only when a baseline is actually down)
    const base = baselineForTargets(state.targets)
    if (state.fireActive === base) state.baselineTime += dt

    // Fire Nova fuse
    const wasFusing = state.fnFuseLeft > 0
    state.fnFuseLeft = Math.max(0, state.fnFuseLeft - dt)

    // Detonation moment
    if (wasFusing && state.fnFuseLeft <= 0 && state.fireActive === "fireNova") {
      // Burst resolves now
      if (state.targetInRange) {
        state.fnBursts += 1
        setCoach("ok", "Burst happened. Replace baseline now.", 1.8)
      } else {
        state.fnMissed += 1
        setCoach("bad", "Burst missed. Target was out of range.", 2.4)
        if (state.gameActive) {
          failGame("Fire Nova missed (out of range)")
        }
      }

      state.fnBurstAt = state.t
      state.fireActive = "none" // Nova is gone after detonation
    }

    if (state.gameActive && state.fnBurstAt != null && state.fireActive === "none") {
      const delay = state.t - state.fnBurstAt
      if (delay > LATE_REPLACE_WARN) {
        failGame("Late baseline replace")
      }
    }

    // Proactive nudges (only if not already showing a message)
    if (state.running && state.armed && state.coachHold <= 0) {
      const rec = recommend()

      // Fire Nova ready nudge
      if (rec === "fireNova") {
        setCoach("warn", "Fire Nova is ready. Drop it now.", READY_NUDGE_HOLD)
      }

      // Get ready to replace when fuse is low, but never tell them to replace early
      if (state.fireActive === "fireNova" && state.fnFuseLeft > 0 && state.fnFuseLeft <= BURST_NUDGE_AT) {
        setCoach("info", `Burst soon. Be ready to replace baseline after detonation.`, 1.4)
      }

      // Slot empty nudge
      if (state.fireActive === "none" && state.gcdLeft <= 0) {
        setCoach("warn", `Fire slot is empty. Drop baseline now.`, 1.6)
      }
    }
  }

  // =========================================================
  // Render
  // =========================================================
  function render() {
    ui.gcd.textContent = state.gcdLeft.toFixed(1)
    ui.mana.textContent = String(Math.round(state.mana))
    ui.fncd.textContent = Math.max(0, state.fnCdLeft).toFixed(1)
    ui.fuse.textContent = Math.max(0, state.fnFuseLeft).toFixed(1)

    // Active icon and label
    const map = FIRE_MAP[state.fireActive] || FIRE_MAP.none
    ui.activeName.textContent = map.label

    if (map.key && SPELLS[map.key]) {
      ui.activeIcon.src = SPELLS[map.key].icon
      ui.activeIcon.style.opacity = "1"
    } else if (SPELLS.searing_totem) {
      ui.activeIcon.src = SPELLS.searing_totem.icon
      ui.activeIcon.style.opacity = "0.35"
    } else {
      ui.activeIcon.removeAttribute("src")
      ui.activeIcon.style.opacity = "0"
    }

    // Rings and bars
    // Outer ring and bar show Fire Nova cooldown as progress (ready means full)
    const cdProgress = state.fnCdLeft <= 0 ? 1 : 1 - state.fnCdLeft / FN_CD
    setRing(ui.ringProgress, CIRC_OUTER, cdProgress)
    setBar(ui.fnCdBar, cdProgress)

    // Fuse bar shows remaining fuse when Nova is down
    const fuseDuration = state.fnFuseDuration || getFnFuseDuration()
    const fuseProgress = state.fnFuseLeft <= 0 ? 0 : state.fnFuseLeft / fuseDuration
    setBar(ui.fuseBar, fuseProgress)

    // Inner ring and bar show GCD progress
    const gcdProgress = 1 - state.gcdLeft / GCD
    setRing(ui.ringGcd, CIRC_INNER, gcdProgress)
    setBar(ui.gcdBar, gcdProgress)

    // Results
    ui.fnCasts.textContent = String(state.fnCasts)
    ui.fnBursts.textContent = String(state.fnBursts)
    ui.fnMissed.textContent = String(state.fnMissed)
    ui.fnCanceled.textContent = String(state.fnCanceled)
    ui.late.textContent = String(state.lateReplaceCount)

    const total = Math.max(0.001, state.fireSlotUptime + state.fireSlotEmptyTime)
    ui.slotPct.textContent = String(Math.round((state.fireSlotUptime / total) * 100))

    ui.gameTime.textContent = state.gameTime.toFixed(1)
    ui.gameBest.textContent = state.gameBest.toFixed(1)

    let gameStatus = "Idle"
    if (state.gameActive) gameStatus = "Running"
    else if (state.gameArmed) gameStatus = "Ready"
    else if (state.gameFailed) gameStatus = `Failed: ${state.gameFailReason}`
    ui.gameStatus.textContent = gameStatus

    if (ui.btnGame) {
      ui.btnGame.textContent = state.gameActive || state.gameArmed ? "Restart run" : "Start run"
    }

    // Button lock and overlays
    const locked = !state.armed || state.gcdLeft > 0
    ui.btnFn.disabled = locked || state.mana < MANA_COST.fireNova || state.fnCdLeft > 0 || !state.targetInRange
    ui.btnSearing.disabled = locked || state.mana < MANA_COST.searing
    ui.btnMagma.disabled = locked || state.mana < MANA_COST.magma

    ui.btnFn.classList.toggle("isOnGcd", state.running && state.gcdLeft > 0)
    ui.btnSearing.classList.toggle("isOnGcd", state.running && state.gcdLeft > 0)
    ui.btnMagma.classList.toggle("isOnGcd", state.running && state.gcdLeft > 0)

    const cdP = state.gcdLeft / GCD
    setCdFill(ui.btnCdFn, cdP)
    setCdFill(ui.btnCdSearing, cdP)
    setCdFill(ui.btnCdMagma, cdP)

    applyCoach()
    applyRecommendationUI(recommend())
  }

  // =========================================================
  // Loop
  // =========================================================
  function loop(now) {
    if (!state.running) return
    const dt = Math.min(0.05, (now - state.lastTick) / 1000) * state.speedMultiplier
    state.lastTick = now

    tick(dt)
    render()
    requestAnimationFrame(loop)
  }

  // =========================================================
  // Events
  // =========================================================
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]")
    if (!btn) return
    const act = btn.dataset.act

    if (act === "start") start()
    if (act === "reset") reset()
    if (act === "game") startGame()

    if (act === "fn") castFireNova()
    if (act === "searing") castBaseline("searing")
    if (act === "magma") castBaseline("magma")
  })

  root.addEventListener("change", (e) => {
    const el = e.target.closest("[data-act]")
    if (!el) return

    if (el.dataset.act === "range") {
      state.targetInRange = !!el.checked
      if (!state.targetInRange) setCoach("info", "Target out of range. Do not drop Fire Nova.", 2.0)
      else setCoach("info", "Target in range. Resume normal decisions.", 1.6)
      render()
    }

    if (el.dataset.act === "targets") {
      const v = Number(el.value || 1)
      state.targets = Math.max(1, Math.min(4, v))
      const base = baselineForTargets(state.targets)
      setCoach("info", `Targets set to ${state.targets}. Baseline is ${base === "magma" ? "Magma" : "Searing"}.`, 2.2)
      render()
    }

    if (el.dataset.act === "improved") {
      const points = Math.max(0, Math.min(2, Number(el.value || 0)))
      const prevDuration = state.fnFuseDuration || getFnFuseDuration()
      state.improvedFireTotems = points
      const nextDuration = getFnFuseDuration()
      if (state.fnFuseLeft > 0 && prevDuration > 0) {
        const ratio = state.fnFuseLeft / prevDuration
        state.fnFuseDuration = nextDuration
        state.fnFuseLeft = Math.min(nextDuration, Math.max(0, ratio * nextDuration))
      } else {
        state.fnFuseDuration = nextDuration
      }
      setCoach(
        "info",
        `Improved Fire Totems set to ${points}. Fire Nova fuse is ${nextDuration.toFixed(1)}s.`,
        2.2
      )
      render()
    }

    if (el.dataset.act === "speed") {
      const speed = Math.max(0.5, Math.min(3, Number(el.value || 1)))
      state.speedMultiplier = speed
      render()
    }
  })

  // Kick off
  reset()

  return {
    start,
    reset,
    castFireNova,
    castSearing: () => castBaseline("searing"),
    castMagma: () => castBaseline("magma"),
    getState: () => ({ ...state }),
  }
}
