# vinext app

This project was created with create-vinext-app.

## Scripts

- `pnpm run dev` starts the vinext dev server.
- `pnpm run build` builds the Cloudflare Worker output.
- `pnpm run start` previews the built Worker locally.
- `pnpm run deploy` deploys the Cloudflare Worker.

## Local validation

- `pnpm typecheck` runs TypeScript validation independently of the build.
- `pnpm lint` checks application code, colocated tests, and JavaScript/TypeScript configs.
- `pnpm format` formats source and configuration files with Prettier.
- `pnpm format:check` checks formatting without writing files.
- `pnpm test` runs Vitest once; `pnpm test vitest.smoke.test.ts` targets a test file.
- `pnpm env:check` / `pnpm env:check:production` check the local environment against the
  Environment Contract (`docs/project/environment.md`) and print only variable names with
  PASS / FAIL / SKIP, never values.

Run these checks and `pnpm build` before considering an implementation validated.
Generated artifacts and the pnpm lockfile are excluded from formatting. Existing
engineering specifications (`AGENTS.md` and `docs/`) are outside the initial
formatting baseline to avoid unrelated rewrites.

Vitest uses an independent Node environment, without loading the production
vinext/Cloudflare plugins. The infrastructure smoke test verifies the
runner; it does not prove React, application, or Workers runtime behavior.
There is no DOM setup, Testing Library, E2E, or CI integration in this phase.

The ESLint flat config uses Next.js Core Web Vitals and TypeScript presets, with
Prettier's compatibility config. ESLint 9 matches the React plugin's declared peer
range, but is upstream end-of-life; revisit it when the plugins support ESLint 10.
TypeScript 7.0 does not expose the compiler API required by typescript-eslint.
Following Microsoft's side-by-side setup, `@typescript/native` aliases TypeScript
7.0.2 (the `tsc` executable used by `pnpm typecheck`), while `typescript` aliases
`@typescript/typescript6` 6.0.2 for lint tooling's compiler API. Neither package
enters the Worker bundle, and no compatibility warnings are suppressed.

## Public configuration

Use `readPublicConfig()` from `src/shared/config/public-config.ts` when an
integration needs public configuration. It reads an explicit `NEXT_PUBLIC_*`
allowlist and delegates to the pure `parsePublicConfig()` parser. It does not
read deployment credentials, Worker bindings, or server secrets. Public values
are build-time inputs: supply them before building and rebuild when they change.

`NEXT_PUBLIC_APP_ENV` is required when the reader is called and accepts only
`development` or `production`, matching `.env.example`. There is no
import-time validation or implicit environment fallback. The scaffold does not
yet consume this reader. Optional integration values normalize blank strings to
`undefined`; consumers must require their own necessary values before enabling
API, auth, or Web3 operations. No default chain, RPC, or Privy ID is chosen.

Boolean input accepts only `true`/`false` after trimming, with debug disabled when
absent. Chain IDs must be positive safe decimal integers. URLs must be absolute
HTTP(S) without user/password credentials; paths, queries, and trailing slashes
are preserved. `NEXT_PUBLIC_SITE_URL` must be an origin (a single trailing slash is
dropped) and `NEXT_PUBLIC_WS_URL` must use `ws:` or `wss:`. This is syntax
validation, not secret detection: never put private credentials in public URLs.
Contract addresses are not environment variables; they belong to the deployment
registry keyed by chain ID.
The debug flag does not activate vConsole or authorize production debug output.

Run `pnpm test src/shared/config/parse-public-config.test.ts` for parser tests.
`app/providers.tsx` composes the QueryClientProvider and receives Server-rendered
children from the Server layout. Query clients are fresh on the server and reused
in the browser; query policies remain with each query's owner. Zustand is available
for future owner-colocated shared client state; no store or persistence is created.
