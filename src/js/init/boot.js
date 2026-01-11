async function loadInto(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    el.innerHTML = await res.text();
  } catch (err) {
    // Fail open. Page should still be usable.
    console.warn(err);
  }
}

export async function boot() {
  await Promise.all([
    loadInto("#appHeader", "/components/header.html"),
    loadInto("#appSidebar", "/components/sidebar.html"),
    loadInto("#appToc", "/components/toc.html"),
    loadInto("#appFooter", "/components/footer.html"),
  ]);
}
