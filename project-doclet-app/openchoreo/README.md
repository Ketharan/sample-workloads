# OpenChoreo platform manifests for Doclet

Project, Component and (where applicable) Workload CRs for deploying Doclet onto OpenChoreo.
Exported from a live cluster, so they reflect what actually ran — including build variables
that are easy to lose when reconstructing by hand.

> Upstream OpenChoreo keeps these in a separate GitOps repo
> (`openchoreo/sample-gitops`) and keeps this repo to source + `workload.yaml`.
> They live here for convenience; decide before proposing anything upstream.

## Layout

```
openchoreo/<project>/
├── project.yaml
└── components/<component>/
    ├── component.yaml     # includes spec.workflow: builder, repo, branch, appPath, build vars
    └── workload.yaml      # BYO-image components only; source-built ones generate theirs
```

## Apply

```sh
kubectl apply -f openchoreo/<project>/project.yaml
# a ProjectReleaseBinding per environment is required before anything can deploy --
# create_project alone does not provision the cell namespace
kubectl apply -f openchoreo/<project>/components/<name>/component.yaml
```

Then trigger a build per source-built component (`trigger_workflow_run`, or the UI).

## Topologies

Each branch carries one topology, because a single `workload.yaml` per appPath cannot
describe both.

| Branch | Project | Frontend | Backends |
|---|---|---|---|
| `add-doclet-workload-descriptors` | `doclet-dockerfile` | nginx image, proxies `/api` + `/ws` | `project` visibility |
| `doclet-gcp-buildpacks` | `doclet-gcp` | GCP buildpacks + `serve` | `external` visibility, called directly by the browser |
| `doclet-paketo-buildpacks` | `doclet-paketo` | Paketo + `BP_WEB_SERVER=nginx` | `external` visibility, called directly by the browser |

## Build variables that matter

Both were found the hard way; without them the builds fail or the app renders blank.

- **`GOOGLE_BUILDABLE=./cmd`** on the Go services. Their `main` lives under `cmd/`, and
  GCP buildpacks build `.` by default — without it the build fails with
  `no Go files in /workspace`.
- **`VITE_BASE_PATH`** on the frontend. OpenChoreo serves components under a path prefix
  and strips it before forwarding. A Vite app built with the default `base: '/'` emits
  absolute `/assets/...` URLs that 404 at the gateway root, so the page renders blank.
- **`VITE_DOC_SERVICE_URL` / `VITE_COLLAB_WS_URL`** on the buildpack frontend only. With
  no nginx there is no reverse proxy, so the browser needs the services' external URLs
  baked in at build time.

## Gotchas

- **Component names are unique per namespace, not per project.** Two projects in the same
  namespace cannot both have a `postgres`. That is why this project uses `gcp-` prefixes,
  and why the descriptors' dependency references differ per branch.
- **The external WebSocket path needs the service's own path appended.**
  `/gcp-collab-ws` 404s; `/gcp-collab-ws/ws` upgrades — the gateway strips only the route prefix.
- **`envBindings` targets must be distinct env var names.** `address: _` is a throwaway
  placeholder; two of them collide as `duplicate entries for key [name="_"]` and the
  Deployment is rejected.
