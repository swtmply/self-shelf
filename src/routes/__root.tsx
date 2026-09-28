import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestUrl } from "@tanstack/react-start/server"

import appCss from "../styles.css?url"

const title = "Self Shelf — Save and organize bookmarks"
const description =
  "Save articles, tools, and ideas in one calm place. Organize bookmarks by category and revisit them whenever you like."
const imageAlt =
  "Self Shelf bookmark collection with the words Keep good links close"
const getSiteOrigin = createServerFn().handler(() => getRequestUrl().origin)

export const Route = createRootRoute({
  loader: () => getSiteOrigin(),
  head: ({ loaderData: origin }) => {
    const pageUrl = new URL("/", origin).href
    const imageUrl = new URL("/og-image.png", origin).href
    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title,
        },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Self Shelf" },
        { property: "og:url", content: pageUrl },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: imageUrl },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: imageAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
        { name: "twitter:image:alt", content: imageAlt },
      ],
      links: [
        { rel: "canonical", href: pageUrl },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }
  },
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="min-h-screen bg-[#f9faf7] font-sans text-[#222723] [font-synthesis:none]">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
