# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Google Drive sync

Create a Google Cloud project, enable the Google Drive API, configure the OAuth consent screen, and create an OAuth client ID for a **Web application**. In that client's **Authorized JavaScript origins**, add both `http://localhost` and `http://localhost:3000` for local development, plus your deployed site's origin if applicable. The origin must match the address in your browser, including its protocol, hostname, and port; `http://127.0.0.1:3000` is a separate origin. If the consent screen is in testing mode, add your Google account as a test user.

Create `.env.local` with:

```text
VITE_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Restart the dev server, then press **Sync now** on each device using the same Google account. The app keeps its local copy and syncs a single `self-shelf.json` file in Google Drive's private app data folder. If both copies changed since the last sync, it asks which copy to keep. Google sign-in is requested when you press the button; sync does not run in the background.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
