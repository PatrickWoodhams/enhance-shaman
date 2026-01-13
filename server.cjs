const express = require("express")
const path = require("path")
const fs = require("fs")
const { createCanvas, loadImage } = require("@napi-rs/canvas")

const app = express()
const PUBLIC_DIR = path.join(__dirname, "public")

function safeSlugToHtmlFile(slug) {
  // Your files use underscores, your URLs use dashes
  // /guide/sync-stagger -> pages/guide/sync_stagger.html
  const safe = String(slug || "").replace(/[^a-z0-9_-]/gi, "")
  return safe.replace(/-/g, "_") + ".html"
}

function sendIfExists(res, relPath) {
  const abs = path.join(PUBLIC_DIR, relPath)
  if (!fs.existsSync(abs)) return false
  res.sendFile(abs)
  return true
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function absUrl(req, p) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http"
  const host = req.headers["x-forwarded-host"] || req.headers.host
  const pathPart = p.startsWith("/") ? p : `/${p}`
  return `${proto}://${host}${pathPart}`
}

function readHtmlBodyFromPublic(relPath) {
  const abs = path.join(PUBLIC_DIR, relPath)
  if (!fs.existsSync(abs)) return null

  const html = fs.readFileSync(abs, "utf8")
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  return m ? m[1] : null
}

function readTextIfExists(relPath) {
  const abs = path.join(PUBLIC_DIR, relPath)
  if (!fs.existsSync(abs)) return null
  return fs.readFileSync(abs, "utf8")
}

function injectOgIntoHtml(req, html, { title, description, ogImage }) {
  const ogImageAbs = absUrl(req, ogImage)
  const pageUrlAbs = absUrl(req, req.originalUrl)

  const ogBlock = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(pageUrlAbs)}" />
    <meta property="og:image" content="${escapeHtml(ogImageAbs)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageAbs)}" />
  `.trim()

  // Remove any existing <title> and meta description so we do not duplicate
  let out = html
    .replace(/<title[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/i, "")

  // Insert OG block right after <head ...>
  out = out.replace(/<head([^>]*)>/i, `<head$1>\n${ogBlock}\n`)

  return out
}

function renderTalentsFromTemplate(req, { title, description, ogImage }) {
  const tpl = readTextIfExists(path.join("pages", "guide", "talents.html"))
  if (!tpl) {
    // Fallback, but you should not hit this
    return `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body>Missing talents template</body></html>`
  }
  return injectOgIntoHtml(req, tpl, { title, description, ogImage })
}

function renderTalentsPage(req, { title, description, ogImage }) {
  // This should match your actual talents page file inside public
  // If your file name differs, change this path
  const bodyInner =
    readHtmlBodyFromPublic(path.join("pages", "guide", "talents.html")) ||
    `<main id="appMain"></main>`

  const ogImageAbs = absUrl(req, ogImage)
  const pageUrlAbs = absUrl(req, req.originalUrl)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(pageUrlAbs)}" />
    <meta property="og:image" content="${escapeHtml(ogImageAbs)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageAbs)}" />

    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#072D42" />

    <link rel="stylesheet" href="/assets/css/index.css" />
  </head>
  <body class="pageTalents">
    ${bodyInner}
    <script type="module" src="/app.js"></script>
  </body>
</html>`
}

/*
  1) Serve static assets first.
     extensions: ["html"] makes this work:
     /pages/guide/sync_stagger  -> /pages/guide/sync_stagger.html
*/
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ["html"],
    index: "index.html",
    fallthrough: true,
  })
)

app.get("/guide", (req, res) => {
  if (!sendIfExists(res, "pages/guide/index.html")) res.status(404).send("Not Found")
})

app.get("/guide/talents", (req, res) => {
  const build = String(req.query.talents || "")

  const title = build ? "Enhancement Shaman Talent Build" : "Talents | Enhancement Shaman Guide"
  const description = build
    ? "Custom Enhancement Shaman talent build for TBC"
    : "Talent planning for Enhancement Shaman in TBC"

  const ogImage = build
    ? `/og/talents?talents=${encodeURIComponent(build)}`
    : "/assets/og/default-talents.png"

  res.status(200).send(renderTalentsFromTemplate(req, { title, description, ogImage }))
})

app.get("/guide/:slug", (req, res) => {
  const file = safeSlugToHtmlFile(req.params.slug)
  const rel = path.join("pages", "guide", file)
  if (!sendIfExists(res, rel)) res.status(404).send("Not Found")
})

app.get("/tools", (req, res) => {
  if (!sendIfExists(res, "pages/tools/index.html")) res.status(404).send("Not Found")
})

app.get("/tools/:slug", (req, res) => {
  const file = safeSlugToHtmlFile(req.params.slug)
  const rel = path.join("pages", "tools", file)
  if (!sendIfExists(res, rel)) res.status(404).send("Not Found")
})

app.get("/builds", (req, res) => {
  if (!sendIfExists(res, "pages/builds/index.html")) res.status(404).send("Not Found")
})

app.get("/encounters", (req, res) => {
  if (!sendIfExists(res, "pages/encounters/index.html")) res.status(404).send("Not Found")
})

app.get("/og/talents", async (req, res) => {
  const raw = String(req.query.talents || "")

  function parseTreePoints(s) {
    let sum = 0
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i) - 48
      if (c >= 0 && c <= 9) sum += c
    }
    return sum
  }

  const parts = raw.split(".")
  const p1 = parseTreePoints(parts[0] || "") // Elemental
  const p2 = parseTreePoints(parts[1] || "") // Enhancement
  const p3 = parseTreePoints(parts[2] || "") // Restoration
  const total = p1 + p2 + p3

  const points = { elemental: p1, enhancement: p2, restoration: p3 }

  function pickSpec(pts) {
    const entries = Object.entries(pts).sort((a, b) => b[1] - a[1])
    const [topKey, topVal] = entries[0]
    const secondVal = entries[1][1]
    if (topVal === 0) return "neutral"
    if (topVal > secondVal) return topKey
    return "neutral"
  }

  const spec = pickSpec(points)

  const SPEC_META = {
    elemental: { label: "Elemental", icon: "Spec1Logo.jpg" },
    enhancement: { label: "Enhancement", icon: "Spec2Logo.jpg" },
    restoration: { label: "Restoration", icon: "Spec3Logo.jpg" },
    neutral: { label: "Shaman", icon: "Shaman.jpg" },
  }

  const meta = SPEC_META[spec]

  const W = 1200
  const H = 630
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext("2d")

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }

  function fillPill(x, y, w, h, r, fill, alpha = 1) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = fill
    roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.restore()
  }

  // ------------------------------------------------------------
  // Background (subtle depth)
  // ------------------------------------------------------------
  ctx.fillStyle = "#070b14"
  ctx.fillRect(0, 0, W, H)

  // Soft top gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, "#0c1730")
  grad.addColorStop(0.55, "#070b14")
  grad.addColorStop(1, "#05070d")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 780)
  vg.addColorStop(0, "rgba(0,0,0,0)")
  vg.addColorStop(1, "rgba(0,0,0,0.45)")
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)

  const pad = 72

  // ------------------------------------------------------------
  // Header row: icon badge + title
  // ------------------------------------------------------------
  const badgeSize = 56
  const badgeX = pad
  const badgeY = 70

  // Badge backing
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2 + 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Load icon and clip to circle
  try {
    const iconPath = path.join(__dirname, "public", "assets", "talents", meta.icon)
    const img = await loadImage(iconPath)

    ctx.save()
    ctx.beginPath()
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, badgeX, badgeY, badgeSize, badgeSize)
    ctx.restore()

    // Thin ring
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2 + 1, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  } catch (e) {
    // ignore if missing
  }

  // Title
  ctx.fillStyle = "#ffffff"
  ctx.font = "700 58px Arial"
  ctx.fillText(`${meta.label} Shaman`, badgeX + badgeSize + 22, 112)

  // Subtitle
  ctx.globalAlpha = 0.85
  ctx.fillStyle = "#cfd7e3"
  ctx.font = "500 28px Arial"
  ctx.fillText("Talent Build", badgeX + badgeSize + 22, 148)
  ctx.globalAlpha = 1

  // ------------------------------------------------------------
  // Stats pills
  // ------------------------------------------------------------
  const pillY = 190
  const pillH = 44
  const gap = 14

  const pills = [
    { label: `Elemental ${p1}`, w: 210 },
    { label: `Enhancement ${p2}`, w: 265 },
    { label: `Restoration ${p3}`, w: 250 },
    { label: `Total ${total}`, w: 165 },
  ]

  let px = pad
  for (const pill of pills) {
    fillPill(px, pillY, pill.w, pillH, 18, "#101a2d", 0.85)
    ctx.fillStyle = "#d9e2ef"
    ctx.font = "600 22px Arial"
    ctx.fillText(pill.label, px + 16, pillY + 29)
    px += pill.w + gap
  }

  // ------------------------------------------------------------
  // Bars (clean, thin)
  // ------------------------------------------------------------
  const barX = pad
  const barY0 = 280
  const labelW = 170
  const trackW = 820
  const trackH = 14
  const rowH = 44
  const maxPerTree = 61

  function drawBarRow(row, label, val) {
    const y = barY0 + row * rowH

    // Label
    ctx.fillStyle = "#9aa4b2"
    ctx.font = "500 26px Arial"
    ctx.fillText(label, barX, y + 18)

    // Track
    const tx = barX + labelW
    const ty = y + 4

    ctx.save()
    ctx.globalAlpha = 0.70
    ctx.fillStyle = "#101a2d"
    roundRect(tx, ty, trackW, trackH, 10)
    ctx.fill()
    ctx.restore()

    // Fill
    const frac = Math.max(0, Math.min(1, val / maxPerTree))
    const fillW = Math.floor(trackW * frac)

    ctx.save()
    ctx.globalAlpha = 0.95
    ctx.fillStyle = "#2e6dd8"
    roundRect(tx, ty, fillW, trackH, 10)
    ctx.fill()
    ctx.restore()

    // Value
    ctx.fillStyle = "#cfd7e3"
    ctx.font = "600 22px Arial"
    ctx.fillText(String(val), tx + trackW + 18, y + 18)
  }

  drawBarRow(0, "Elemental", p1)
  drawBarRow(1, "Enhancement", p2)
  drawBarRow(2, "Restoration", p3)

  // ------------------------------------------------------------
  // Footer
  // ------------------------------------------------------------
  ctx.globalAlpha = 0.65
  ctx.fillStyle = "#cfd7e3"
  ctx.font = "22px Arial"
  ctx.fillText("Open this link to view and edit the build", pad, H - 60)
  ctx.globalAlpha = 1

  const png = canvas.toBuffer("image/png")
  res.setHeader("Content-Type", "image/png")
  res.setHeader("Cache-Control", "public, max-age=300")
  res.status(200).send(png)
})

app.get("/pages/guide/talents", (req, res) => {
  const build = String(req.query.talents || "")

  const origin = `${req.protocol}://${req.get("host")}`
  const ogUrl = `${origin}${req.originalUrl}`
  const ogImage = `${origin}/og/talents?talents=${encodeURIComponent(build)}`

  const filePath = path.join(PUBLIC_DIR, "pages", "guide", "talents.html")
  let html = fs.readFileSync(filePath, "utf8")

  const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Shaman Talent Build" />
    <meta property="og:description" content="Shared talent build for The Burning Crusade." />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
  `

  html = html.replace("</head>", `${ogTags}\n</head>`)
  res.status(200).send(html)
})

function injectOgIntoTalentsHtml(req, res) {
  const build = String(req.query.talents || "")

  const origin = `${req.protocol}://${req.get("host")}`
  const ogUrl = `${origin}${req.originalUrl}`
  const ogImage = `${origin}/og/talents?talents=${encodeURIComponent(build)}`

  const filePath = path.join(PUBLIC_DIR, "pages", "guide", "talents.html")
  let html = fs.readFileSync(filePath, "utf8")

  const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Shaman Talent Build" />
    <meta property="og:description" content="Shared talent build for The Burning Crusade." />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
  `

  html = html.replace("</head>", `${ogTags}\n</head>`)
  res.status(200).send(html)
}

// Clean share URL
app.get("/guide/talents", injectOgIntoTalentsHtml)

// Your current URL
app.get("/pages/guide/talents", injectOgIntoTalentsHtml)

/*
  3) Final fallback
*/
app.use((req, res) => {
  res.status(404).send("Not Found")
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})
