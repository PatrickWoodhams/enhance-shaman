function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function fmt(num, digits = 2) {
  const n = Number(num)
  if (!Number.isFinite(n)) return "0.00"
  return n.toFixed(digits)
}

export function initSwingLab() {
  const root = document.getElementById("swingLab")
  if (!root) return

  // Only skip if we have already successfully bound listeners
  if (root.dataset.bound === "1") return

  const mhSpeedEl = document.getElementById("labMhSpeed")
  const ohSpeedEl = document.getElementById("labOhSpeed")
  const latencyEl = document.getElementById("labLatency")
  const directionEl = document.getElementById("labDirection")

  const startBtn = document.getElementById("labStart")
  const startGameBtn = document.getElementById("labStartGame")
  const stopBtn = document.getElementById("labStop")
  const resetBtn = document.getElementById("labReset")
  const delayBtn = document.getElementById("labDelayOh")
  const desyncBtn = document.getElementById("labDesync")

  const mhDot = document.getElementById("labMhDot")
  const ohDot = document.getElementById("labOhDot")
  const mhFill = document.getElementById("labMhFill")
  const ohFill = document.getElementById("labOhFill")

  const statusEl = document.getElementById("labStatus")
  const deltaEl = document.getElementById("labDelta")
  const deltaNeedleEl = document.getElementById("labDeltaNeedle")

  const gamePanelEl = document.getElementById("labGamePanel")
  const roundEl = document.getElementById("labRound")
  const roundsTotalEl = document.getElementById("labRoundsTotal")
  const gameTimeEl = document.getElementById("labGameTime")
  const gameResultEl = document.getElementById("labGameResult")

  const flurryChargesEl = document.getElementById("labFlurryCharges")
  const wfStateEl = document.getElementById("labWfState")
  const feedEl = document.getElementById("labFeed")

  // If the page swapped in and the lab is not fully present yet, do not mark as bound
  if (
    !mhSpeedEl || !ohSpeedEl || !latencyEl || !directionEl ||
    !startBtn || !startGameBtn || !stopBtn || !resetBtn || !delayBtn ||
    !mhDot || !ohDot || !mhFill || !ohFill ||
    !statusEl || !deltaEl || !deltaNeedleEl ||
    !gamePanelEl || !roundEl || !roundsTotalEl || !gameTimeEl || !gameResultEl ||
    !flurryChargesEl || !wfStateEl || !feedEl
  ) {
    return
  }

  // Mark bound only after we know the lab exists and can bind listeners
  root.dataset.bound = "1"

  // =========================================================
  // Constants
  // =========================================================
  const SYNC_WINDOW_SEC = 0.5
  const GAME_ROUNDS = 10
  const EPS_SEC = 0.004

  // Proc simulation is illustrative, not a full combat sim
  const FLURRY_CONSUME_WINDOW_SEC = 0.5
  const WF_ICD_SEC = 3.0
  const WF_PROC_CHANCE = 0.22
  const CRIT_CHANCE_MH = 0.28
  const CRIT_CHANCE_OH = 0.20

  // =========================================================
  // Runtime state
  // =========================================================
  let running = false
  let rafId = 0

  let mhSpeed = 2.6
  let ohSpeed = 2.6
  let latencyMs = 60

  let suppressNextOhWrap = false

  // Visual direction only. Timing math is always phase 0..1.
  // rtl means Start is on the right and the dot travels toward Hit on the left.
  let direction = "rtl"
  let directionApplied = null

  let mhStart = 0
  let ohStart = 0

  let prevMhPhase = 0
  let prevOhPhase = 0

  let lastSwingMhAt = null
  let lastSwingOhAt = null

  // Pair anchor to prevent false out of sync state between a completed swing
  // and the other hand that has not landed yet
  let pairAnchorHand = null // "MH" or "OH"
  let pairAnchorAt = null   // timestamp seconds

  // Game scoring latch
  let pendingMhAt = null

  let gameActive = false
  let gameRound = 0
  let gameStartAt = 0
  let gameBest = null

  let flurryCharges = 0
  let lastFlurryConsumeAt = -Infinity
  let wfIcdUntil = 0

  // =========================================================
  // Helpers
  // =========================================================
  function nowSec() {
    return performance.now() / 1000
  }

  function readInputs() {
    const mh = Number(mhSpeedEl.value)
    const oh = Number(ohSpeedEl.value)
    const lat = Number(latencyEl.value)

    const nextDir = String(directionEl.value || "rtl")
    direction = nextDir

    if (Number.isFinite(mh) && mh > 0.5) mhSpeed = mh
    if (Number.isFinite(oh) && oh > 0.5) ohSpeed = oh
    if (Number.isFinite(lat) && lat >= 0) latencyMs = lat

    if (directionApplied !== nextDir) {
      directionApplied = nextDir
      applyDirectionUi()
    }
  }

  function isRtl() {
    return direction === "rtl"
  }

  function applyDirectionUi() {
    const rtl = isRtl()
    root.classList.toggle("labDirRtl", rtl)
    root.classList.toggle("labDirLtr", !rtl)

    const metas = root.querySelectorAll(".labTrackMeta")
    metas.forEach((meta) => {
      const spans = meta.querySelectorAll("span")
      if (spans.length < 2) return

      if (rtl) {
        spans[0].textContent = "Hit"
        spans[1].textContent = "Start"
      } else {
        spans[0].textContent = "Start"
        spans[1].textContent = "Hit"
      }
    })
  }

  function phaseAt(t, start, period) {
    if (period <= 0) return 0
    const dt = t - start
    const p = dt / period
    return p - Math.floor(p)
  }

  function nextSwingIn(phase, period) {
    return (1 - phase) * period
  }

  function setDot(dot, phase) {
    const p = clamp(phase, 0, 1)
    const dirP = isRtl() ? (1 - p) : p
    const x = clamp(dirP, 0.005, 0.995) * 100
    dot.style.left = `${x}%`
  }

  function setFill(fill, phase) {
    fill.style.width = `${clamp(phase, 0, 1) * 100}%`
  }

  function pushFeed(text, tone = "") {
    // Keep your existing CSS. We treat "bad" as an alias for the existing "warn" class.
    const cls = tone === "bad" ? "warn" : tone

    const line = document.createElement("div")
    line.className = `labFeedItem${cls ? ` ${cls}` : ""}`
    line.textContent = text
    feedEl.prepend(line)

    while (feedEl.childNodes.length > 8) {
      feedEl.removeChild(feedEl.lastChild)
    }
  }
  function setStatus(label, cls) {
    statusEl.textContent = label
    statusEl.classList.remove("labGood", "labWarn", "labBad")
    statusEl.classList.add(cls)
  }

  function computeStatusFromDelta(delta) {
    const abs = Math.abs(delta)

    let label = "Out of window"
    let cls = "labBad"

    if (abs <= SYNC_WINDOW_SEC) {
      if (delta >= 0) {
        label = "In window, main hand leads"
        cls = "labGood"
      } else {
        label = "In window, off hand leads"
        cls = "labWarn"
      }
    }

    return { delta, abs, label, cls }
  }

  // This fixes the false out of sync state that occurs immediately after MH wraps
  // by latching the last swing as the anchor for up to 0.5 seconds
  function computeLiveDelta(t, mhNextAt, ohNextAt) {
    if (pairAnchorAt != null && pairAnchorHand) {
      const age = t - pairAnchorAt
      if (age > SYNC_WINDOW_SEC + EPS_SEC) {
        pairAnchorAt = null
        pairAnchorHand = null
      } else {
        // Ensure the other hand has not already landed after the anchor
        if (pairAnchorHand === "MH") {
          if (lastSwingOhAt == null || lastSwingOhAt < pairAnchorAt - EPS_SEC) {
            return ohNextAt - pairAnchorAt // OH minus MH
          }
          pairAnchorAt = null
          pairAnchorHand = null
        } else {
          if (lastSwingMhAt == null || lastSwingMhAt < pairAnchorAt - EPS_SEC) {
            return pairAnchorAt - mhNextAt // OH minus MH, negative when MH is after OH
          }
          pairAnchorAt = null
          pairAnchorHand = null
        }
      }
    }

    // Default: compare the next upcoming hit times
    return ohNextAt - mhNextAt
  }

  function resetProcs() {
    flurryCharges = 3
    lastFlurryConsumeAt = -Infinity
    wfIcdUntil = 0

    flurryChargesEl.textContent = String(flurryCharges)
    wfStateEl.textContent = "Ready"

    feedEl.innerHTML = ""
  }

  function updateProcReadout(t) {
    flurryChargesEl.textContent = String(flurryCharges)

    const left = wfIcdUntil - t
    if (left <= 0) {
      wfStateEl.textContent = "Ready"
    } else {
      wfStateEl.textContent = `ICD ${fmt(left, 2)}s`
    }
  }

  function resetSwingMemory() {
    lastSwingMhAt = null
    lastSwingOhAt = null
    pendingMhAt = null
    pairAnchorHand = null
    pairAnchorAt = null
  }

  function randomizeOutOfSync() {
    const t = nowSec()

    // Randomize both hands but force the next hit timing difference outside the 0.5s window.
    let tries = 0
    while (tries < 60) {
      const mhPhase = Math.random()
      const ohPhase = Math.random()

      const mhStartCandidate = t - mhPhase * mhSpeed
      const ohStartCandidate = t - ohPhase * ohSpeed

      const mhNext = nextSwingIn(mhPhase, mhSpeed)
      const ohNext = nextSwingIn(ohPhase, ohSpeed)

      const delta = ohNext - mhNext
      if (Math.abs(delta) > SYNC_WINDOW_SEC + 0.15) {
        mhStart = mhStartCandidate
        ohStart = ohStartCandidate
        return
      }

      tries += 1
    }

    // Fallback
    mhStart = t
    ohStart = t - 0.8 * ohSpeed
  }

  function applyDesync() {
    readInputs()

    if (!running) {
      startPractice()
    }

    randomizeOutOfSync()
    resetSwingMemory()

    const t = nowSec()
    prevMhPhase = phaseAt(t, mhStart, mhSpeed)
    prevOhPhase = phaseAt(t, ohStart, ohSpeed)

    setDot(mhDot, prevMhPhase)
    setDot(ohDot, prevOhPhase)
    setFill(mhFill, prevMhPhase)
    setFill(ohFill, prevOhPhase)

    const mhNextAt = t + nextSwingIn(prevMhPhase, mhSpeed)
    const ohNextAt = t + nextSwingIn(prevOhPhase, ohSpeed)
    const delta = computeLiveDelta(t, mhNextAt, ohNextAt)
    const st = computeStatusFromDelta(delta)

    setStatus(st.label, st.cls)
    deltaEl.textContent = `${fmt(st.delta, 3)}s`

    const range = 1.5
    const pos = ((clamp(st.delta, -range, range) + range) / (2 * range)) * 100
    deltaNeedleEl.style.left = `${pos}%`

    updateProcReadout(t)

    if (gameActive) {
      gameResultEl.textContent = "Manual desync applied"
    }

    pushFeed("Desync applied. Hands randomized.", "warn")
  }

  function beginGame() {
    readInputs()

    // Start game should take over even if practice is already running.
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    running = false

    gameActive = true
    gameRound = 0
    gameStartAt = nowSec()

    roundsTotalEl.textContent = String(GAME_ROUNDS)
    roundEl.textContent = "0"
    gameTimeEl.textContent = "0.00s"
    gameResultEl.textContent = ""

    gamePanelEl.hidden = false

    resetProcs()
    pushFeed("Game started. Earn 10 clean syncs.", "")
    pushFeed("Score condition: MH hit then OH hit within 0.5s.", "")

    // In nextRound
    pushFeed(`Round ${gameRound}: drift applied`, "")

    // In reset (gameActive branch)
    pushFeed(`Round ${gameRound}: reset`, "")

    // In startPractice
    pushFeed("Practice started", "")

    running = true
    nextRound()
    applyDirectionUi()
    tick()
  }

  function nextRound() {
    if (!gameActive) return

    gameRound += 1
    roundEl.textContent = String(gameRound)
    gameResultEl.textContent = ""

    randomizeOutOfSync()
    resetSwingMemory()

    const t = nowSec()
    prevMhPhase = phaseAt(t, mhStart, mhSpeed)
    prevOhPhase = phaseAt(t, ohStart, ohSpeed)

    pushFeed(`Round ${gameRound}: drift applied`, "warn")
  }

  function finishGame() {
    gameActive = false

    const total = nowSec() - gameStartAt
    const label = `Completed in ${fmt(total, 2)}s`

    gameResultEl.textContent = label
    setStatus("Game complete", "labGood")

    pushFeed(label, "good")

    if (gameBest == null || total < gameBest) {
      gameBest = total
      pushFeed(`New best: ${fmt(gameBest, 2)}s`, "good")
    } else {
      pushFeed(`Best: ${fmt(gameBest, 2)}s`, "")
    }

    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  function startPractice() {
    readInputs()

    // Allow restarting practice even if game or practice is already running.
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    running = false

    gameActive = false
    gamePanelEl.hidden = true
    gameResultEl.textContent = ""

    resetProcs()

    const t = nowSec()
    mhStart = t
    ohStart = t

    prevMhPhase = 0
    prevOhPhase = 0

    resetSwingMemory()

    running = true
    pushFeed("Practice started", "")
    applyDirectionUi()
    tick()
  }

  function stop() {
    running = false
    gameActive = false

    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0

    setStatus("Stopped", "labBad")
  }

  function reset() {
    const t = nowSec()

    mhStart = t
    ohStart = t

    prevMhPhase = 0
    prevOhPhase = 0

    resetSwingMemory()

    if (gameActive) {
      // Keep the game running but restart the current round drift.
      randomizeOutOfSync()
      resetSwingMemory()
      pushFeed(`Round ${gameRound}: reset`, "warn")
    } else {
      pushFeed("Reset", "")
    }
  }

  function delayOffHandWithLatency() {
    if (!running) return

    const apply = () => {
      const t = nowSec()
      const ohPhase = phaseAt(t, ohStart, ohSpeed)

      // Only allow delaying after midpoint to mimic your intended timing rule
      if (ohPhase <= 0.5) {
        if (gameActive) gameResultEl.textContent = "Too early. Wait until off hand passes midpoint."
        return
      }

      const targetPhase = 0.5
      ohStart = t - targetPhase * ohSpeed
      suppressNextOhWrap = true
      if (gameActive) gameResultEl.textContent = "Macro tap applied"
    }

    const ms = clamp(latencyMs, 0, 350)
    window.setTimeout(apply, ms)
  }

  function consumeFlurryIfAllowed(hand, t) {
    if (flurryCharges <= 0) return

    if (t - lastFlurryConsumeAt >= FLURRY_CONSUME_WINDOW_SEC) {
      flurryCharges -= 1
      lastFlurryConsumeAt = t

      // Bad if off hand consumed the charge, good if main hand consumed it
      const tone = hand === "MH" ? "good" : "bad"
      pushFeed(`Flurry charge consumed by ${hand}. ${flurryCharges} left`, tone)

      // Neutral informational line when it ends
      if (flurryCharges <= 0) {
        flurryCharges = 0
        pushFeed("Flurry faded", "")
      }
    }
  }

  function maybeCritRefresh(hand) {
    const roll = Math.random()
    const chance = hand === "MH" ? CRIT_CHANCE_MH : CRIT_CHANCE_OH

    if (flurryCharges <= 0 && roll < chance) {
      flurryCharges = 3
      pushFeed(`Crit on ${hand}. Flurry refreshed to 3 charges`, "good")
      return
    }

    if (flurryCharges > 0 && roll < chance * 0.35) {
      flurryCharges = 3
      pushFeed(`Crit on ${hand}. Flurry refreshed`, "good")
    }
  }

  // This supports your red rule if an off hand proc ever happens
  function maybeWindfuryProc(hand, t) {
    if (t < wfIcdUntil) return

    if (Math.random() < WF_PROC_CHANCE) {
      wfIcdUntil = t + WF_ICD_SEC

      // Good if main hand got it, bad if off hand got it
      const tone = hand === "MH" ? "good" : "bad"
      pushFeed(`Windfury proc on ${hand}`, tone)
    }
  }

  // In onSwing, either keep the call as is (safe because the function now gates on MH)
  // or make it explicit by replacing the existing call with this:
  function onSwing(hand, t) {
    if (hand === "MH") lastSwingMhAt = t
    else lastSwingOhAt = t

    updatePairAnchorOnSwing(hand, t)

    if (hand === "MH") {
      pendingMhAt = t
    } else {
      scoreIfEligibleOnOffHand(t)
    }

    maybeCritRefresh(hand)
    consumeFlurryIfAllowed(hand, t)

    // Explicit main hand only
    if (hand === "MH") maybeWindfuryProc(hand, t)
  }


  // Update pair anchor so the status delta stays correct between the first hit
  // and the second hit of a potential sync pair
  function updatePairAnchorOnSwing(hand, t) {
    if (pairAnchorAt != null && pairAnchorHand && pairAnchorHand !== hand) {
      const dt = t - pairAnchorAt
      if (dt <= SYNC_WINDOW_SEC + EPS_SEC) {
        // Pair completed, clear anchor and do not open a new anchor on the second hit
        pairAnchorAt = null
        pairAnchorHand = null
        return
      }
    }

    // No active pair or not a pair completion, open or replace anchor
    pairAnchorHand = hand
    pairAnchorAt = t
  }

  function scoreIfEligibleOnOffHand(t) {
    if (!gameActive) return
    if (pendingMhAt == null) return

    const diff = t - pendingMhAt
    if (diff >= 0 && diff < SYNC_WINDOW_SEC) {
      pushFeed(`Score. Off hand after main hand by ${fmt(diff, 3)}s`, "good")
      pendingMhAt = null

      if (gameRound === GAME_ROUNDS) {
        finishGame()
      } else {
        nextRound()
      }
    }
  }

  function onSwing(hand, t) {
    if (hand === "MH") lastSwingMhAt = t
    else lastSwingOhAt = t

    updatePairAnchorOnSwing(hand, t)

    // Game latch
    if (hand === "MH") {
      pendingMhAt = t
    } else {
      scoreIfEligibleOnOffHand(t)
    }

    // Proc simulation
    maybeCritRefresh(hand)
    consumeFlurryIfAllowed(hand, t)
    maybeWindfuryProc(hand, t)
  }

  function tick() {
    if (!running) return

    readInputs()

    const t = nowSec()
    const mhPhase = phaseAt(t, mhStart, mhSpeed)
    const ohPhase = phaseAt(t, ohStart, ohSpeed)

    // Detect swing wrap events (approx, per frame)
    if (mhPhase < prevMhPhase) onSwing("MH", t)

    if (suppressNextOhWrap) {
      // Consume the suppression and do not emit a swing event this frame
      suppressNextOhWrap = false
    } else if (ohPhase < prevOhPhase) {
      onSwing("OH", t)
    }

    prevMhPhase = mhPhase
    prevOhPhase = ohPhase

    setDot(mhDot, mhPhase)
    setDot(ohDot, ohPhase)
    setFill(mhFill, mhPhase)
    setFill(ohFill, ohPhase)

    const mhNextAt = t + nextSwingIn(mhPhase, mhSpeed)
    const ohNextAt = t + nextSwingIn(ohPhase, ohSpeed)

    const delta = computeLiveDelta(t, mhNextAt, ohNextAt)
    const st = computeStatusFromDelta(delta)

    setStatus(st.label, st.cls)
    deltaEl.textContent = `${fmt(st.delta, 3)}s`

    // Delta meter
    const range = 1.5
    const pos = ((clamp(st.delta, -range, range) + range) / (2 * range)) * 100
    deltaNeedleEl.style.left = `${pos}%`

    // Game clock
    if (gameActive) {
      const elapsed = t - gameStartAt
      gameTimeEl.textContent = `${fmt(elapsed, 2)}s`
    }

    updateProcReadout(t)

    rafId = requestAnimationFrame(tick)
  }

  // =========================================================
  // Event wiring
  // =========================================================
  mhSpeedEl.addEventListener("input", readInputs)
  ohSpeedEl.addEventListener("input", readInputs)
  latencyEl.addEventListener("input", readInputs)
  directionEl.addEventListener("change", () => {
    readInputs()
    applyDirectionUi()
  })

  startBtn.addEventListener("click", startPractice)
  startGameBtn.addEventListener("click", beginGame)
  stopBtn.addEventListener("click", stop)
  resetBtn.addEventListener("click", reset)
  delayBtn.addEventListener("click", delayOffHandWithLatency)
  if (desyncBtn) desyncBtn.addEventListener("click", applyDesync)

  // Keyboard shortcuts: D = delay, G = start game
  // Bound once, but the API reference is updated on every init.
  window.__swingLabApi = {
    startPractice,
    beginGame,
    stop,
    reset,
    delayOffHandWithLatency,
    applyDesync,
  }

  if (!window.__swingLabKeysBound) {
    window.__swingLabKeysBound = true

    document.addEventListener("keydown", (e) => {
      // Avoid hijacking typing
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ""
      if (tag === "input" || tag === "textarea" || tag === "select") return

      const api = window.__swingLabApi
      if (!api) return

      if (e.key === "d" || e.key === "D") {
        api.delayOffHandWithLatency()
      } else if (e.key === "g" || e.key === "G") {
        api.beginGame()
      } else if (e.key === "r" || e.key === "R") {
        api.reset()
      } else if (e.key === "Escape") {
        api.stop()
      }
    })
  }

  // Initialize defaults
  readInputs()
  resetProcs()
  applyDirectionUi()
  setStatus("Ready", "labBad")
}
