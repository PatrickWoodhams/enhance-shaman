// /src/js/tools/airTwistLab.js
import { SPELLS } from "../data/spells.js"
import { hydrateSpellRefs } from "../ui/spell_refs.js"

export function mountAirTwistLab(root) {
  // =========================================================
  // Core timings
  // =========================================================
  const WF_DURATION = 10.0
  const GCD = 1.5

  // =========================================================
  // Coaching tuning
  // =========================================================
  const EARLY_REFRESH_WASTE_THRESHOLD = 3.0
  const RECOMMEND_REFRESH_AT = 1.8
  const WF_REFRESH_WARN = 1.6
  const GOA_LATE_GRACE = 0.60

  const MANA_COST = {
    windfury: 8,
    grace: 8,
  }

  const AIR_MAP = {
    windfury: { key: "windfury_totem", label: "Windfury Totem" },
    grace: { key: "grace_of_air_totem", label: "Grace of Air Totem" },
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

    airActive: "none",

    wfBuffLeft: 0,
    wfAppliedTime: 0,
    wfDowntime: 0,
    wfDrops: 0,
    wfCasts: 0,

    graceTime: 0,

    wastedWfCasts: 0,
    totalCasts: 0,

    partyInRange: true,
    movementLockLeft: 0,

    // Game mode
    gameArmed: false,
    gameActive: false,
    gameTime: 0,
    gameBest: 0,
    gameFailed: false,
    gameFailReason: "",

    // Coaching helpers
    wfCastAt: null,
    goaCastAt: null,
    wfDropAt: null,

    coachHold: 0,
    coachLevel: "info",
    coachHtml: "",
  }

  // =========================================================
  // UI markup
  // =========================================================
  root.innerHTML = `
    <section class="contentCard airTwistLabCard">
      <div class="eyebrow">Trainer</div>
      <h2>Air Totem Twisting Lab</h2>

      <div class="labRow labRowTop">
        <button class="btn" data-act="start" type="button">Start</button>
        <button class="btn btnGhost" data-act="reset" type="button">Reset</button>
        <button class="btn btnSecondary" data-act="game" type="button">Start run</button>

        <label class="labToggle" aria-label="Party in range">
          <input type="checkbox" data-act="range" checked />
          <span>Party in range</span>
        </label>
      </div>

      <div class="labHud">
        <div class="labTotemCard" aria-label="Active air totem">
          <div class="labTotemRing">
            <svg class="labRingSvg" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="labRingTrack" cx="32" cy="32" r="26"></circle>
              <circle class="labRingProgress" cx="32" cy="32" r="26"></circle>
              <circle class="labRingGcd" cx="32" cy="32" r="22"></circle>
            </svg>

            <img class="labTotemIcon" data-bind="activeIcon" alt="" />
          </div>

          <div class="labTotemMeta">
            <div class="labMetaLabel">Active air totem</div>
            <div class="labMetaValue" data-bind="activeName">None</div>

            <div class="labMiniRow">
              <div class="labMiniLabel">Windfury buff</div>
              <div class="labMiniValue"><span data-bind="wf">0.0</span>s</div>
            </div>

            <div class="labBar" aria-label="Windfury buff bar">
              <div class="labBarFill" data-bind="wfBar"></div>
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
            Cast Windfury, then Grace. Refresh Windfury before it expires.
          </div>

          <div class="labButtons">
            <button class="btn labCastBtn" data-act="wf" type="button">
              <span class="labCastContent"><span data-spell="windfury_totem"></span></span>
              <span class="labBtnCd" aria-hidden="true">
                <span class="labBtnCdFill" data-bind="btnCdWf"></span>
              </span>
            </button>

            <button class="btn labCastBtn" data-act="goa" type="button">
              <span class="labCastContent"><span data-spell="grace_of_air_totem"></span></span>
              <span class="labBtnCd" aria-hidden="true">
                <span class="labBtnCdFill" data-bind="btnCdGoa"></span>
              </span>
            </button>
          </div>

          <div class="labResults">
            <div><strong>Windfury casts:</strong> <span data-bind="casts">0</span></div>
            <div><strong>Windfury drops:</strong> <span data-bind="drops">0</span></div>
            <div><strong>Windfury downtime:</strong> <span data-bind="down">0.0</span>s</div>
            <div><strong>Grace uptime:</strong> <span data-bind="gracePct">0</span>%</div>
            <div><strong>Wasted Windfury refreshes:</strong> <span data-bind="waste">0</span></div>
            <div><strong>Run time:</strong> <span data-bind="gameTime">0.0</span>s</div>
            <div><strong>Best run:</strong> <span data-bind="gameBest">0.0</span>s</div>
            <div><strong>Run status:</strong> <span data-bind="gameStatus">Idle</span></div>
          </div>
        </div>
      </div>
    </section>
  `

  hydrateSpellRefs(root)

  // =========================================================
  // UI refs
  // =========================================================
  const ui = {
    activeIcon: root.querySelector('[data-bind="activeIcon"]'),
    activeName: root.querySelector('[data-bind="activeName"]'),
    ringProgress: root.querySelector(".labRingProgress"),
    ringGcd: root.querySelector(".labRingGcd"),

    gcd: root.querySelector('[data-bind="gcd"]'),
    wf: root.querySelector('[data-bind="wf"]'),
    mana: root.querySelector('[data-bind="mana"]'),

    wfBar: root.querySelector('[data-bind="wfBar"]'),
    gcdBar: root.querySelector('[data-bind="gcdBar"]'),

    coach: root.querySelector('[data-bind="coach"]'),
    casts: root.querySelector('[data-bind="casts"]'),
    drops: root.querySelector('[data-bind="drops"]'),
    down: root.querySelector('[data-bind="down"]'),
    gracePct: root.querySelector('[data-bind="gracePct"]'),
    waste: root.querySelector('[data-bind="waste"]'),
    gameTime: root.querySelector('[data-bind="gameTime"]'),
    gameBest: root.querySelector('[data-bind="gameBest"]'),
    gameStatus: root.querySelector('[data-bind="gameStatus"]'),

    btnWf: root.querySelector('[data-act="wf"]'),
    btnGoa: root.querySelector('[data-act="goa"]'),
    btnGame: root.querySelector('[data-act="game"]'),

    btnCdWf: root.querySelector('[data-bind="btnCdWf"]'),
    btnCdGoa: root.querySelector('[data-bind="btnCdGoa"]'),
  }

  // =========================================================
  // Ring setup
  // =========================================================
  const R_WF = 26
  const CIRC_WF = 2 * Math.PI * R_WF
  ui.ringProgress.style.strokeDasharray = `${CIRC_WF} ${CIRC_WF}`
  ui.ringProgress.style.strokeDashoffset = `${CIRC_WF}`

  const R_GCD = 22
  const CIRC_GCD = 2 * Math.PI * R_GCD
  ui.ringGcd.style.strokeDasharray = `${CIRC_GCD} ${CIRC_GCD}`
  ui.ringGcd.style.strokeDashoffset = `${CIRC_GCD}`

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
  // Coaching
  // =========================================================
  function setCoach(level, html, holdSec = 2.4) {
    state.coachLevel = level
    state.coachHtml = html
    state.coachHold = holdSec
  }

  function renderCoachDefault() {
    if (!state.partyInRange) {
      return "Party out of range. Totems will not apply."
    }
    if (!state.armed) {
      return "Press Start, then cast Windfury or Grace to begin."
    }
    if (!state.running) {
      return "Ready. Cast Windfury or Grace to begin."
    }
    return "Goal: refresh Windfury before it drops, then swap back to Grace on the next GCD."
  }

  function applyCoach() {
    const text =
      state.coachHold > 0 && state.coachHtml
        ? state.coachHtml
        : renderCoachDefault()

    const level =
      state.coachHold > 0
        ? state.coachLevel
        : "info"

    ui.coach.className = `labCoachText labCoach_${level}`
    ui.coach.innerHTML = text
    hydrateSpellRefs(ui.coach)
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
    setCoach("info", "Run started. Keep Windfury up and swap back to Grace quickly.", 2.2)
  }

  function resetRunState() {
    state.running = false
    state.armed = false
    state.t = 0
    state.lastTick = 0

    state.gcdLeft = 0
    state.movementLockLeft = 0
    state.mana = state.manaMax

    state.airActive = "none"
    state.wfBuffLeft = 0

    state.wfCastAt = null
    state.goaCastAt = null
    state.wfDropAt = null
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
    state.movementLockLeft = 0
    render()
  }

  // =========================================================
  // Recommendation
  // =========================================================
  function recommend() {
    if (!state.running) return "wait"
    if (!state.partyInRange) return "wait"
    if (state.gcdLeft > 0) return "wait"
    if (state.movementLockLeft > 0) return "wait"

    if (state.wfBuffLeft <= 0) return "windfury"
    if (state.wfBuffLeft <= RECOMMEND_REFRESH_AT) return "windfury"
    if (state.airActive !== "grace") return "grace"
    return "wait"
  }

  function applyRecommendationUI(rec) {
    ui.btnWf.classList.toggle("isRecommended", rec === "windfury")
    ui.btnGoa.classList.toggle("isRecommended", rec === "grace")
  }

  // =========================================================
  // Casting rules
  // =========================================================
  function canCast(cost) {
    if (!state.armed) return false
    if (state.gcdLeft > 0) return false
    if (state.movementLockLeft > 0) return false
    if (state.mana < cost) return false
    return true
  }

  function ensureRunning() {
    if (state.running) return
    state.running = true
    state.lastTick = performance.now()
    if (state.gameArmed && !state.gameActive) {
      beginGameRun()
    }
    requestAnimationFrame(loop)
  }

  function spendMana(amount) {
    state.mana = Math.max(0, state.mana - amount)
  }

  function castWindfury() {
    const cost = MANA_COST.windfury
    if (!canCast(cost)) {
      if (state.running && state.mana < cost) {
        setCoach("bad", "Not enough mana for Windfury.")
      }
      if (!state.armed) {
        setCoach("info", "Press Start, then cast Windfury or Grace to begin.", 2.2)
      }
      return
    }

    ensureRunning()

    state.wfCasts += 1
    state.totalCasts += 1
    state.gcdLeft = GCD
    spendMana(cost)

    const leftBefore = state.wfBuffLeft

    // If it was dropped, report recovery delay
    if (state.wfDropAt != null) {
      const down = state.t - state.wfDropAt
      state.wfDropAt = null
      setCoach(
        down > 0.6 ? "bad" : "warn",
        `Windfury dropped for ${down.toFixed(1)}s. Refresh earlier next time.`
      )
    } else if (leftBefore > EARLY_REFRESH_WASTE_THRESHOLD) {
      state.wastedWfCasts += 1
      setCoach("warn", `Early refresh, ${leftBefore.toFixed(1)}s still left. Try to wait longer.`)
      if (state.gameActive) {
        failGame(`Windfury refreshed too early (${leftBefore.toFixed(1)}s left)`)
      }
    } else {
      setCoach("ok", `Windfury refreshed. Next cast <span data-spell="grace_of_air_totem"></span>.`)
    }

    state.wfCastAt = state.t
    state.airActive = "windfury"

    if (state.partyInRange) {
      state.wfBuffLeft = WF_DURATION
    } else {
      // Totem drop still happens, buff does not apply
      setCoach("warn", "Party out of range. Windfury did not apply.", 3.0)
      if (state.gameActive) {
        failGame("Windfury missed (out of range)")
      }
    }
  }

  function castGrace() {
    const cost = MANA_COST.grace
    if (!canCast(cost)) {
      if (state.running && state.mana < cost) {
        setCoach("bad", "Not enough mana for Grace of Air.")
      }
      if (!state.armed) {
        setCoach("info", "Press Start, then cast Windfury or Grace to begin.", 2.2)
      }
      return
    }

    ensureRunning()

    state.totalCasts += 1
    state.gcdLeft = GCD
    spendMana(cost)

    state.airActive = "grace"
    state.goaCastAt = state.t

    if (state.wfCastAt != null) {
      const delay = state.t - state.wfCastAt
      if (delay > GCD + GOA_LATE_GRACE) {
        setCoach(
          "warn",
          `Late swap back, Grace came ${delay.toFixed(1)}s after Windfury. Aim for the next GCD.`
        )
        if (state.gameActive) {
          failGame("Late swap back to Grace")
        }
      } else {
        setCoach("ok", "Good swap back. Track Windfury and refresh before it expires.")
      }
    } else {
      setCoach("info", "Grace down. Track Windfury and refresh before it expires.")
    }

    if (!state.partyInRange) {
      setCoach("warn", "Party out of range. Totem effects will not apply.", 3.0)
    }
  }

  // =========================================================
  // Reset and start
  // =========================================================
  function reset() {
    state.running = false
    state.armed = false
    state.t = 0
    state.lastTick = 0

    state.gcdLeft = 0
    state.mana = state.manaMax

    state.airActive = "none"
    state.wfBuffLeft = 0
    state.wfAppliedTime = 0
    state.wfDowntime = 0
    state.wfDrops = 0
    state.wfCasts = 0

    state.graceTime = 0

    state.wastedWfCasts = 0
    state.totalCasts = 0

    state.movementLockLeft = 0

    state.gameArmed = false
    state.gameActive = false
    state.gameTime = 0
    state.gameBest = 0
    state.gameFailed = false
    state.gameFailReason = ""

    state.wfCastAt = null
    state.goaCastAt = null
    state.wfDropAt = null

    state.coachHold = 0
    state.coachLevel = "info"
    state.coachHtml = ""

    render()
  }

  function start() {
    if (state.armed) return
    state.armed = true
    setCoach("info", "Ready. Cast Windfury or Grace to begin.", 3.0)
    render()
  }

  // =========================================================
  // Tick
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
    state.movementLockLeft = Math.max(0, state.movementLockLeft - dt)

    state.coachHold = Math.max(0, state.coachHold - dt)

    const wasUp = state.wfBuffLeft > 0
    state.wfBuffLeft = Math.max(0, state.wfBuffLeft - dt)
    const isUp = state.wfBuffLeft > 0

    if (isUp) state.wfAppliedTime += dt
    else state.wfDowntime += dt

    if (state.airActive === "grace" && isUp) {
      state.graceTime += dt
    }

    // Windfury fell off
    if (wasUp && !isUp) {
      state.wfDrops += 1
      state.wfDropAt = state.t
      setCoach("bad", "Windfury dropped. Cast Windfury as soon as GCD allows.", 3.0)
      if (state.gameActive) {
        failGame("Windfury dropped")
      }
    }

    if (
      state.gameActive &&
      state.partyInRange &&
      state.airActive === "windfury" &&
      state.wfCastAt != null &&
      state.gcdLeft <= 0 &&
      state.wfBuffLeft > WF_REFRESH_WARN
    ) {
      const since = state.t - state.wfCastAt
      if (since > GCD + GOA_LATE_GRACE) {
        failGame("Late swap back to Grace")
      }
    }

    // Proactive coaching when not already showing a message
    if (state.running && state.coachHold <= 0 && state.partyInRange) {
      // If they refreshed WF and are sitting on it, push them back to Grace
      if (state.airActive === "windfury" && state.wfBuffLeft > 0 && state.gcdLeft <= 0) {
        if (state.wfCastAt != null) {
          const since = state.t - state.wfCastAt
          if (since >= GOA_LATE_GRACE && state.wfBuffLeft > WF_REFRESH_WARN) {
            setCoach("warn", `Windfury applied. Swap back to <span data-spell="grace_of_air_totem"></span>.`, 1.8)
          }
        }
      }

      // If Windfury is close to expiring and they are free, tell them to refresh
      if (state.gcdLeft <= 0 && state.wfBuffLeft > 0 && state.wfBuffLeft <= WF_REFRESH_WARN) {
        if (state.airActive !== "windfury") {
          setCoach("warn", `Windfury expires in ${state.wfBuffLeft.toFixed(1)}s. Refresh now.`, 1.6)
        }
      }

      // If Windfury is down and they are free, tell them to recover
      if (state.gcdLeft <= 0 && state.wfBuffLeft <= 0) {
        setCoach("bad", "Windfury is down. Cast Windfury now.", 1.8)
      }
    }
  }

  // =========================================================
  // Render
  // =========================================================
  function render() {
    ui.gcd.textContent = state.gcdLeft.toFixed(1)
    ui.wf.textContent = state.wfBuffLeft.toFixed(1)
    ui.mana.textContent = String(Math.round(state.mana))

    // Active totem icon and label
    const map = AIR_MAP[state.airActive] || AIR_MAP.none
    ui.activeName.textContent = map.label

    if (map.key && SPELLS[map.key]) {
      ui.activeIcon.src = SPELLS[map.key].icon
      ui.activeIcon.style.opacity = "1"
    } else if (SPELLS.windfury_totem) {
      ui.activeIcon.src = SPELLS.windfury_totem.icon
      ui.activeIcon.style.opacity = "0.35"
    } else {
      ui.activeIcon.removeAttribute("src")
      ui.activeIcon.style.opacity = "0"
    }

    // Ring display
    // Outer ring: WF buff remaining
    setRing(ui.ringProgress, CIRC_WF, state.wfBuffLeft / WF_DURATION)
    // Inner ring: GCD progress
    setRing(ui.ringGcd, CIRC_GCD, 1 - state.gcdLeft / GCD)

    // Bars
    setBar(ui.wfBar, state.wfBuffLeft / WF_DURATION)
    setBar(ui.gcdBar, 1 - state.gcdLeft / GCD)

    // Results
    ui.drops.textContent = String(state.wfDrops)
    ui.casts.textContent = String(state.wfCasts)
    ui.down.textContent = state.wfDowntime.toFixed(1)

    const total = Math.max(0.001, state.wfAppliedTime + state.wfDowntime)
    ui.gracePct.textContent = String(Math.round((state.graceTime / total) * 100))
    ui.waste.textContent = String(state.wastedWfCasts)

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

    // Button lock and GCD overlay
    const locked = !state.armed || state.gcdLeft > 0 || state.movementLockLeft > 0
    ui.btnWf.disabled = locked || state.mana < MANA_COST.windfury
    ui.btnGoa.disabled = locked || state.mana < MANA_COST.grace

    ui.btnWf.classList.toggle("isOnGcd", state.running && state.gcdLeft > 0)
    ui.btnGoa.classList.toggle("isOnGcd", state.running && state.gcdLeft > 0)

    const cdP = state.gcdLeft / GCD
    setCdFill(ui.btnCdWf, cdP)
    setCdFill(ui.btnCdGoa, cdP)

    // Coach and recommendations
    applyCoach()
    applyRecommendationUI(recommend())
  }

  // =========================================================
  // Main loop
  // =========================================================
  function loop(now) {
    if (!state.running) return
    const dt = Math.min(0.05, (now - state.lastTick) / 1000)
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
    if (act === "wf") castWindfury()
    if (act === "goa") castGrace()
  })

  root.addEventListener("change", (e) => {
    const el = e.target.closest("[data-act]")
    if (!el) return
    if (el.dataset.act === "range") {
      state.partyInRange = !!el.checked
      if (!state.partyInRange) {
        setCoach("info", "Party out of range. Totems will not apply.", 2.2)
      } else {
        setCoach("info", "Party in range. Resume normal twisting decisions.", 1.8)
      }
    }
  })

  // Initial paint
  reset()

  return {
    start,
    reset,
    castWindfury,
    castGrace,
    getState: () => ({ ...state }),
  }
}
