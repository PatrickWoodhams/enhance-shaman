const MEASUREMENT_ID = "G-SK8ZT28BJB"
const SCRIPT_ID = "ga-gtag"

function loadGtag() {
  if (document.getElementById(SCRIPT_ID)) return
  const script = document.createElement("script")
  script.async = true
  script.id = SCRIPT_ID
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
  }
}

export function initAnalytics() {
  if (!MEASUREMENT_ID || window.__gaInitialized) return
  window.__gaInitialized = true

  ensureDataLayer()
  loadGtag()

  window.gtag("js", new Date())
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false })

  trackPageView()
}

export function trackPageView() {
  if (!MEASUREMENT_ID || typeof window.gtag !== "function") return
  const pagePath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  })
}
