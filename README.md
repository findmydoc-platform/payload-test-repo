# Payload Test Repo

This repository contains small, public, reproducible tests for Payload and its database adapters. Each reproduction is isolated on a permanent branch so an issue can link to an immutable commit.

## Main baseline

The `main` branch is a working Payload v3 baseline:

- Payload: `3.90.2`
- Node.js: `24.15.0`
- pnpm: `11.9.0`
- Database: PostgreSQL 15

## Run the baseline smoke test

```sh
pnpm install
docker compose up -d
pnpm test
```

The smoke test creates one collection row inside a real Payload transaction, commits it, and verifies the row through a separate PostgreSQL connection.

## Reproduction branches

Use one permanent branch per external test case:

```text
repro/<short-case-name>
```

Once a reproduction branch is published, do not rebase, force-push, or delete it. Issue reports must link to a fixed commit on that branch. The first reproduction is [`repro/drizzle-commit-error`](https://github.com/findmydoc-platform/payload-test-repo/tree/repro/drizzle-commit-error).

Each branch README or branch-specific section documents its expected output and the Payload version under test.

## `repro/drizzle-commit-error`

This branch pins the Payload packages to `3.88.0`. It installs a deferred PostgreSQL constraint trigger that raises during `COMMIT` after a Payload transaction has inserted a row.

Run it with:

```sh
pnpm install
docker compose up -d
pnpm test
```

Expected output:

```text
REPRODUCED: commitTransaction resolved, PostgreSQL rolled back, persisted rows: 0
```

The test intentionally asserts the behavior of the unpatched adapter. If `commitTransaction()` propagates the PostgreSQL error, the test fails because that indicates the adapter behavior has changed.

## License

MIT
