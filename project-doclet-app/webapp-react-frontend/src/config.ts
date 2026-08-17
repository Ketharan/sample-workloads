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

// When the app is served by a static file server rather than the nginx image, there is
// no /api and /ws reverse proxy, so the browser must call the services directly. Baking
// the URLs in at build time covers that; they take precedence over config.json.
const BUILT_IN_DOC_URL = import.meta.env.VITE_DOC_SERVICE_URL
const BUILT_IN_WS_URL = import.meta.env.VITE_COLLAB_WS_URL

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig
  }
  if (BUILT_IN_DOC_URL && BUILT_IN_WS_URL) {
    cachedConfig = {
      docServiceUrl: BUILT_IN_DOC_URL,
      collabWsUrl: BUILT_IN_WS_URL,
    }
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
