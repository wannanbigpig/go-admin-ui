# Security and Permission Fixes - 2026-05

## Scope

-   Frontend project: `x-l-admin-vue3`
-   Related backend project: `go-layout`
-   Goal: keep existing business behavior, fix permission/token consistency risks, and improve readability around high-risk flows.

## Frontend Changes

-   Login redirect targets are normalized through a shared helper to prevent external redirect injection.
-   Auth store reset now removes the correct persisted key and guards stale `refreshUserInfo` responses.
-   Route generation rejects duplicate route names and paths, and missing components fall back to a controlled `NotFound` component.
-   Permission directive defaults unauthorized elements to hidden state and avoids duplicate disabled-click bindings.
-   Sensitive admin-user field reveal now has per-row loading state, failure rollback, and a short-lived row cache.
-   Blob JSON API errors now go through normal response handling, so 401 and business errors behave consistently.
-   Upload requests no longer force `Content-Type`; the browser can attach the correct multipart boundary.
-   Menu button form submission no longer silently overwrites `is_show`.

## Backend Coordination

-   Disabled users can no longer refresh tokens.
-   Token revocation is applied after successful user mutation transactions.
-   Token validation can fall back to database revocation records when Redis misses.
-   Menu, role, and API permission mutations synchronize affected user permissions after successful writes.

## Verification

-   `npm run type-check`
-   `npm test -- --run`
-   `npm run lint`
-   `npm run build:production`

## Notes

-   No intentional business behavior changes were introduced.
-   Frontend changes stay within existing composables, stores, router guards, and request helper patterns.
