export type AppConfig = {
  docServiceUrl: string
  collabWsUrl: string
}

let cachedConfig: AppConfig | null = null

// Vite injects the build-time `base` here (e.g. "/doclet-frontend-webapp/", or "/" locally).
// Backend paths must carry it: the browser resolves them against the gateway root, not
// against the page's path prefix.
const BASE = import.meta.env.BASE_URL

// Absolute URLs pass through untouched (compose supplies http://localhost:8081);
// anything else is treated as relative to the app's base path.
function resolve(path: string): string {
  if (/^(https?|wss?):\/\//.test(path)) {
    return path
  }
  return `${BASE}${path.replace(/^\//, '')}`
}

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig
  }
  try {
    const res = await fetch(`${BASE}config.json`, { cache: 'no-store' })
    if (res.ok) {
      const raw = (await res.json()) as AppConfig
      cachedConfig = {
        docServiceUrl: resolve(raw.docServiceUrl),
        collabWsUrl: resolve(raw.collabWsUrl),
      }
      return cachedConfig
    }
  } catch {
    // Fall back to defaults below.
  }
  cachedConfig = {
    docServiceUrl: resolve('api/document-svc'),
    collabWsUrl: resolve('ws/collab-svc'),
  }
  return cachedConfig
}
