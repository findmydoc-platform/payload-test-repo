# Agent Instructions

## Purpose

This repository contains small, public, reproducible tests for Payload and its database adapters. Keep the repository independent of private application code, credentials, and external services.

## Branches

- `main` contains the stable Payload baseline and its normal transaction smoke test.
- New published reproductions use `repro/YYYYMMDD-HHmmssZ-<short-case-name>` with a UTC timestamp.
- Use temporary `work/YYYYMMDD-HHmmssZ-<short-case-name>` branches while preparing a reproduction.
- Use `fix/YYYYMMDD-HHmmssZ-<short-case-name>` for separate fix experiments; never fix a published reproduction branch.
- Before creating a branch, check the remote branch list for an existing timestamp and case name.
- `repro/drizzle-commit-error` is the documented legacy exception to this naming convention.
- After publication, never rebase, force-push, update, or delete a `repro/*` branch.

## Mandatory preflight

Before changing this repository for a new request:

1. Understand the problem and its desired evidence.
2. Check existing `repro/*` branches and their READMEs.
3. Check open and closed issues in `payloadcms/payload` for the same problem.
4. Check the repository README and current branch state.
5. Reuse an existing reproduction when it is a meaningful match; do not create a duplicate.

Use the `grilling` skill only when the problem or requested evidence is materially unclear. Once the problem is sufficiently understood, proceed without repeating settled questions.

## Reproduction requirements

- Test behavior through public Payload APIs and a real PostgreSQL service.
- Prefer an independent database connection when the test observes persistence or rollback.
- Pin all relevant Payload packages on a reproduction branch.
- Document the Payload version, command, and expected output in the branch README.
- The final reproduction commit must be the immutable commit linked from the upstream issue.

## Upstream issue workflow

- Upstream issues are created in `https://github.com/payloadcms/payload`.
- Use the v3 bug report template at `.github/ISSUE_TEMPLATE/1.bug_report_v3.yml`.
- The issue must link to the fixed reproduction commit, not only to a moving branch.
- If an upstream issue is created after a reproduction branch was published, do not modify that branch to add the link. Record the issue link in `main` documentation instead.
- If an upstream issue exists before publication, link it from the reproduction README.
- Add a support comment only when the reproduction provides concrete new evidence. Keep it short, specific, and human; do not post generic agreement comments or comment when there is no added value.

## Validation

Run the repository's documented install, PostgreSQL, format, typecheck, and test commands before publishing a reproduction. Keep the GitHub Action free of secrets and external services.
