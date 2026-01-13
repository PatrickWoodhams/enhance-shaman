export function buildToc() {
  const tocRoot = document.querySelector("#appToc");
  const main = document.querySelector("#appMain");
  if (!tocRoot || !main) return;

  const headings = main.querySelectorAll("h2, h3");
  if (!headings.length) {
    tocRoot.innerHTML = "";
    return;
  }

  const items = [];
  headings.forEach((h) => {
    if (!h.id) {
      h.id = (h.textContent || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "");
    }

    items.push({
      id: h.id,
      text: h.textContent || "",
      level: h.tagName === "H2" ? 2 : 3,
    });
  });

  tocRoot.innerHTML = items
    .map((i) => {
      const cls = i.level === 2 ? "tocItem tocH2" : "tocItem tocH3";
      return `<a class="${cls}" href="#${i.id}">${i.text}</a>`;
    })
    .join("");
}