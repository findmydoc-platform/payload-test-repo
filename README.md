# Payload MCP cache revalidation reproduction

This branch demonstrates a cache invalidation mismatch between the Payload MCP endpoint and its ordinary REST endpoint in a real Next.js application.

Upstream report: [payloadcms/payload#18490](https://github.com/payloadcms/payload/issues/18490).

## Versions

- Payload, Postgres adapter, Next integration and MCP plugin: `3.92.1`
- Next.js: `16.4.5`
- MCP SDK: `1.32.2`
- MCP handler: `1.1.0`
- MCP plugin Zod: `4.6.7`
- Node.js: `24.22.2`
- pnpm: `11.9.0`
- PostgreSQL: `15`

The lockfile pins the complete dependency graph. The reproduction contains no private application code, production credentials or external service dependency.

## Run

Use an available PostgreSQL port 5432 and HTTP port 3000. The test starts and stops its own Next.js child process. It creates random local authentication credentials, never prints them, and removes its user, API key and item in cleanup.

```sh
corepack pnpm install --frozen-lockfile
docker compose --project-name payload-mcp-cache-repro up --detach --wait
corepack pnpm typecheck
corepack pnpm test
docker compose --project-name payload-mcp-cache-repro down
```

The GitHub Action supplies the equivalent PostgreSQL service directly. `DATABASE_URI` can select another disposable local PostgreSQL database.

## Expected evidence

The item collection invalidates `repro-items` through `revalidateTag(tag, { expire: 0 })` in its `afterChange` hook. A 25 ms asynchronous wait in that hook makes response-completion ordering reproducible. The same hook runs for both transports.

The test first warms an `unstable_cache` read, updates the item through the actual MCP HTTP endpoint, and independently reads PostgreSQL to verify the write committed. It then reads the same cache. An authenticated REST PATCH supplies the control update.

The affected versions produce:

```json
{
  "initial": "initial",
  "storedAfterMcp": "via-mcp",
  "cachedAfterMcp": "initial",
  "cachedAfterRest": "via-rest"
}
```

The command exits successfully only when it reproduces that mismatch and the REST control succeeds. This success means the bug was reproduced. Correct behavior would return `via-mcp` immediately after the completed MCP call, in which case this reproduction assertion fails.

The MCP transport returns a streaming `Response` before the tool's asynchronous write and hook complete. Next.js finalizes pending tag revalidations when its route handler returns. The endpoint response boundary must include completion of the write and its cache side effects.

Keep this published reproduction immutable. Prepare fix experiments on a separate `fix/` branch.

## Baseline smoke test

The original native Payload transaction smoke test remains available as `corepack pnpm test:smoke`.

## License

MIT
