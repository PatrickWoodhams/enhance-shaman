import { buildToc } from "./ui/toc.js";

function isInternalLink(a) {
  if (!a || !a.href) return false;
  const url = new URL(a.href, window.location.origin);
  return url.origin === window.location.origin;
}

function scrollToHashIfNeeded() {
  const hash = window.location.hash;
  if (!hash) return;

  const id = hash.slice(1);
  if (!id) return;

  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ block: "start" });
}

async function swapMainContent(urlPath) {
  document.body.classList.add("isNavigating");

  const res = await fetch(urlPath, { headers: { "X-Requested-With": "fetch" } });
  if (!res.ok) throw new Error(`Navigation fetch failed: ${urlPath}`);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const nextMain = doc.querySelector("#appMain");
  const main = document.querySelector("#appMain");

  if (!main || !nextMain) {
    window.location.href = urlPath;
    return;
  }

  main.innerHTML = nextMain.innerHTML;

  const nextTitle = doc.querySelector("title");
  if (nextTitle) document.title = nextTitle.textContent || document.title;

  buildToc();

  const mainEl = document.getElementById("appMain");
  if (mainEl) mainEl.focus();

  window.scrollTo(0, 0);
  scrollToHashIfNeeded();

  document.body.classList.remove("isNavigating");
  document.dispatchEvent(new CustomEvent("app:navigated"));
}

export function enhanceNavigation() {
  buildToc();

  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    if (a.target && a.target !== "_self") return;
    if (!isInternalLink(a)) return;

    const url = new URL(a.href, window.location.href);

    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();

    history.pushState({}, "", url.pathname + url.search + url.hash);

    try {
      await swapMainContent(url.pathname);
    } catch (err) {
      console.warn(err);
      window.location.href = url.pathname;
    }
  });

  window.addEventListener("popstate", async () => {
    try {
      await swapMainContent(window.location.pathname);
    } catch {
      window.location.reload();
    }
  });
}
