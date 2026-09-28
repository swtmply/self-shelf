const fileName = "self-shelf.json"
const scope = "https://www.googleapis.com/auth/drive.appdata"

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              error?: string
            }) => void
            error_callback: (error: { type: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export function getDriveToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const oauth2 = window.google?.accounts.oauth2
    if (!oauth2) {
      reject(new Error("Google sign-in is still loading. Try again."))
      return
    }
    oauth2
      .initTokenClient({
        client_id: clientId,
        scope,
        callback: (response) =>
          response.access_token
            ? resolve(response.access_token)
            : reject(new Error(response.error ?? "Google sign-in failed.")),
        error_callback: (error) =>
          reject(new Error(`Google sign-in: ${error.type}`)),
      })
      .requestAccessToken()
  })
}

async function driveRequest(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  })
  if (!response.ok)
    throw new Error(`Google Drive request failed (${response.status}).`)
  return response
}

export async function findDriveFile(token: string): Promise<string | null> {
  const query = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${fileName}' and trashed = false`,
    fields: "nextPageToken,files(id)",
    pageSize: "2",
  })
  const response = await driveRequest(
    token,
    `https://www.googleapis.com/drive/v3/files?${query}`
  )
  const data: { files?: { id: string }[] } = await response.json()
  if (data.files && data.files.length > 1)
    throw new Error("Multiple sync files found in Google Drive.")
  return data.files?.[0]?.id ?? null
}

export async function readDriveFile(
  token: string,
  id: string
): Promise<unknown> {
  const response = await driveRequest(
    token,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`
  )
  return response.json()
}

export async function writeDriveFile(
  token: string,
  contents: string,
  id: string | null
): Promise<string> {
  // ponytail: simple and multipart uploads cover files under 5 MB; use resumable upload if needed.
  if (new Blob([contents]).size > 5_000_000)
    throw new Error("Collection is too large for Drive sync (5 MB limit).")
  if (id) {
    await driveRequest(
      token,
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(id)}?uploadType=media`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: contents,
      }
    )
    return id
  }

  const boundary = `self-shelf-${crypto.randomUUID()}`
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name: fileName, parents: ["appDataFolder"] }),
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`,
    contents,
    `\r\n--${boundary}--`,
  ])
  const response = await driveRequest(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  )
  const file: { id?: string } = await response.json()
  if (!file.id) throw new Error("Google Drive did not return a file ID.")
  return file.id
}
