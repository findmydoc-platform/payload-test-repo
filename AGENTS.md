# Agent Instructions

## Purpose

This repository contains small, public, reproducible tests for Payload and its database adapters. Keep the repository independent of private application code, credentials, and external services.

## Branches

- `main` contains the stable Payload baseline and its normal transaction smoke test.
- Published reproductions use `repro/<short-case-name>`.
- Use temporary `work/<short-case-name>` branches while preparing a reproduction.
- Use `fix/<short-case-name>` for separate fix experiments; never fix a published reproduction branch.
- After publication, never rebase, force-push, update, or delete a `repro/*` branch.

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

## Validation

Run the repository's documented install, PostgreSQL, format, typecheck, and test commands before publishing a reproduction. Keep the GitHub Action free of secrets and external services.
