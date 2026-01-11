function qs(id) {
  return document.getElementById(id);
}

function openSearch() {
  document.body.classList.add("searchOpen");
}

function closeSearch() {
  document.body.classList.remove("searchOpen");
}

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderResults(container, results) {
  if (!container) return;

  if (!results || !results.length) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  const rows = results
    .map((r, idx) => {
      const icon = r.icon ? `<img class="searchResultIcon" src="${escapeHtml(r.icon)}" alt="" />` : "";
      const badge = `<span class="searchResultBadge">${escapeHtml(r.subtitle || r.kind)}</span>`;
      const title = `<div class="searchResultTitle">${escapeHtml(r.title)}</div>`;
      const meta = `<div class="searchResultMeta">${badge}<span class="searchResultUrl">${escapeHtml(r.url)}</span></div>`;

      return `
        <a class="searchResult" href="${escapeHtml(r.url)}" role="option" aria-selected="false" data-idx="${idx}">
          ${icon}
          <div class="searchResultText">
            ${title}
            ${meta}
          </div>
        </a>
      `;
    })
    .join("");

  container.innerHTML = `<div class="searchResultsList" role="listbox">${rows}</div>`;
  container.hidden = false;
}

function setActive(container, idx) {
  const items = container ? container.querySelectorAll(".searchResult") : [];
  if (!items.length) return;

  const max = items.length - 1;
  const next = Math.max(0, Math.min(max, idx));

  items.forEach((el, i) => {
    const active = i === next;
    el.classList.toggle("isActive", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });

  const el = items[next];
  if (el) el.scrollIntoView({ block: "nearest" });

  return next;
}

export function initSearch() {
  const input = qs("globalSearch");
  const panel = qs("searchPanel");
  const resultsEl = qs("searchResults");

  if (!input || !panel || !resultsEl) return;

  const emptyEl = panel.querySelector(".searchEmpty");

  const worker = new Worker("/src/js/workers/search.worker.js", { type: "module" });
  let activeIndex = 0;
  let lastQuery = "";
  let debounceId = 0;

  worker.postMessage({ type: "init" });

  worker.addEventListener("message", (e) => {
    const msg = e.data || {};
    if (msg.type !== "results") return;

    if (msg.query !== lastQuery) return;

    const results = msg.results || [];
    renderResults(resultsEl, results);

    if (emptyEl) emptyEl.hidden = results.length > 0;

    activeIndex = 0;
    activeIndex = setActive(resultsEl, activeIndex) ?? 0;
  });

  function runQuery(q) {
    lastQuery = q;
    worker.postMessage({ type: "query", query: q });
  }

  input.addEventListener("input", () => {
    const q = input.value || "";
    openSearch();

    if (debounceId) window.clearTimeout(debounceId);
    debounceId = window.setTimeout(() => {
      const trimmed = q.trim();
      if (!trimmed) {
        resultsEl.innerHTML = "";
        resultsEl.hidden = true;
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      runQuery(trimmed);
    }, 60);
  });

  input.addEventListener("keydown", (e) => {
    const items = resultsEl.querySelectorAll(".searchResult");

    if (e.key === "Escape") {
      closeSearch();
      input.blur();
      return;
    }

    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = setActive(resultsEl, activeIndex + 1) ?? activeIndex;
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = setActive(resultsEl, activeIndex - 1) ?? activeIndex;
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const el = items[activeIndex];
      if (el) {
        closeSearch();
        el.click();
      }
    }
  });

  resultsEl.addEventListener("mousemove", (e) => {
    const a = e.target.closest(".searchResult");
    if (!a) return;
    const idx = Number(a.getAttribute("data-idx"));
    if (Number.isFinite(idx)) activeIndex = setActive(resultsEl, idx) ?? activeIndex;
  });

  resultsEl.addEventListener("click", (e) => {
    const a = e.target.closest(".searchResult");
    if (!a) return;
    closeSearch();
  });

  document.addEventListener("app:navigated", () => {
    closeSearch();
    input.value = "";
    resultsEl.innerHTML = "";
    resultsEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
  });
}