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
repro/YYYYMMDD-HHmmssZ-<short-case-name>
```

Use the same UTC timestamp convention for preparation and fix branches:

```text
work/YYYYMMDD-HHmmssZ-<short-case-name>
fix/YYYYMMDD-HHmmssZ-<short-case-name>
```

Once a reproduction branch is published, do not rebase, force-push, or delete it. Issue reports must link to a fixed commit on that branch. The first reproduction is [`repro/drizzle-commit-error`](https://github.com/findmydoc-platform/payload-test-repo/tree/repro/drizzle-commit-error).

The first branch predates the timestamp convention and is the documented legacy exception. No sequential register is maintained; before creating a new branch, check the remote branch list and existing READMEs for a matching case.

Each branch README or branch-specific section documents its expected output and the Payload version under test.

## License

MIT
