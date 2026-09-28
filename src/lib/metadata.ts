import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { createServerFn } from "@tanstack/react-start"

function isPublicAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19))
    )
  }

  if (isIP(address) === 6) {
    const value = address.toLowerCase()
    return !(
      value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe8") ||
      value.startsWith("fe9") ||
      value.startsWith("fea") ||
      value.startsWith("feb") ||
      value.startsWith("::ffff:")
    )
  }

  return false
}

async function publicUrl(value: string) {
  const url = new URL(value)
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Enter a public http or https link.")
  }
  const addresses = await lookup(url.hostname, { all: true })
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new Error("This link cannot be previewed.")
  }
  return url
}

function decode(value: string) {
  return value
    .replace(
      /&(#(?:x[\da-f]+|\d+)|amp|quot|apos|lt|gt|nbsp);/gi,
      (match, entity: string) => {
        const named: Record<string, string> = {
          amp: "&",
          quot: '"',
          apos: "'",
          lt: "<",
          gt: ">",
          nbsp: " ",
        }
        if (entity[0] === "#") {
          const code =
            entity[1].toLowerCase() === "x"
              ? Number.parseInt(entity.slice(2), 16)
              : Number.parseInt(entity.slice(1), 10)
          return code > 0 && code <= 0x10ffff
            ? String.fromCodePoint(code)
            : match
        }
        return named[entity.toLowerCase()] ?? match
      }
    )
    .trim()
}

export const getMetadata = createServerFn({ method: "POST" })
  .validator((value: string) => value)
  .handler(async ({ data }) => {
    let url = await publicUrl(data)
    let response: Response | undefined

    for (let redirect = 0; redirect < 4; redirect++) {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "text/html" },
      })
      if (![301, 302, 303, 307, 308].includes(response.status)) break
      const location = response.headers.get("location")
      if (!location) break
      await response.body?.cancel()
      url = await publicUrl(new URL(location, url).href)
    }

    if (
      !response?.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      return { title: "", description: "", image: "" }
    }

    const reader = response.body?.getReader()
    if (!reader) return { title: "", description: "", image: "" }
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < 512_000) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
    await reader.cancel().catch(() => undefined)
    const html = new TextDecoder().decode(Buffer.concat(chunks))
    const tags = html.match(/<meta\b[^>]*>/gi) ?? []
    const metadata = new Map<string, string>()
    for (const tag of tags) {
      const attributes = new Map<string, string>()
      for (const match of tag.matchAll(
        /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
      )) {
        attributes.set(
          match[1].toLowerCase(),
          decode(match[2] || match[3] || match[4])
        )
      }
      const key = attributes.get("property") ?? attributes.get("name")
      const content = attributes.get("content")
      if (key && content) metadata.set(key.toLowerCase(), content)
    }

    const rawImage =
      metadata.get("og:image") ?? metadata.get("twitter:image") ?? ""
    let image = ""
    try {
      const imageUrl = new URL(rawImage, url)
      if (["http:", "https:"].includes(imageUrl.protocol)) image = imageUrl.href
    } catch {
      /* An image is optional. */
    }

    return {
      title:
        metadata.get("og:title") ??
        decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
      description:
        metadata.get("og:description") ?? metadata.get("description") ?? "",
      image,
    }
  })
