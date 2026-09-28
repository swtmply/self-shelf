const art = (top, bottom, word, accent) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="485" cy="110" r="135" fill="${accent}" opacity=".28"/><circle cx="560" cy="290" r="175" fill="#fff" opacity=".12"/><path d="M-20 292C160 180 265 390 650 190" fill="none" stroke="#fff" stroke-width="32" opacity=".24"/><text x="320" y="225" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="53" font-weight="800" letter-spacing="-3">${word}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const bookmarks = [
  ["https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout", "Learn CSS Grid layout", "The essential guide to building flexible, two-dimensional layouts for the web.", "Development", art("#315b82", "#83bfd1", "CSS GRID", "#b8e0ed")],
  ["https://www.figma.com/design-systems/", "Build better design systems", "Keep reusable ideas, patterns, and inspiration together in one place.", "Design", art("#6c5795", "#d9accb", "DESIGN", "#f9dae8")],
  ["https://react.dev/learn", "React: Learn the basics", "A practical reference for creating interfaces with components.", "Development", art("#315e67", "#8acdc3", "REACT", "#b8f1e9")],
  ["https://www.are.na/", "A space for creative research", "Collect connections and ideas worth returning to later.", "Inspiration", art("#b26759", "#efbb83", "IDEAS", "#ffe3bc")],
  ["https://www.typescriptlang.org/docs/handbook/intro.html", "The TypeScript Handbook", "Helpful language notes and examples for the next project.", "Articles", art("#31568d", "#7ca6dd", "TYPES", "#c2dcfa")],
  ["https://www.notion.com/product", "One place for your work", "An example of a useful tool to revisit when planning workflows.", "Tools", art("#435d48", "#a6bd8f", "TOOLS", "#dcebc6")],
  ["https://web.dev/learn/css", "Learn CSS", "A structured way to refresh the fundamentals of web styling.", "Articles", art("#a9526d", "#e8a9a9", "LEARN", "#f6c6d0")],
  ["https://developer.chrome.com/docs/devtools/", "Chrome DevTools", "Useful debugging tools for the next time something feels off.", "Tools", art("#575475", "#aba5cc", "DEBUG", "#ddd8f4")],
  ["https://www.figma.com/community", "Explore the Figma Community", "Browse shared resources, files, and ideas from other makers.", "Inspiration", art("#7a5855", "#d7aa95", "EXPLORE", "#eed3c1")],
].map(([url, title, description, category, image], index) => ({
  id: `marketing-${index + 1}`,
  url,
  title,
  description,
  category,
  image,
}))

localStorage.setItem("read-later.collection", JSON.stringify({
  bookmarks,
  categories: ["Articles", "Design", "Development", "Tools", "Inspiration"],
}))
location.reload()
