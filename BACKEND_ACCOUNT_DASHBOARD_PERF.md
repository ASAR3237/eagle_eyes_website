# Backend: /account/ slow to load (and sometimes stuck) — context + instructions

## Context

### What the page is
`https://www.eagleeyessearch.com/account/` is the signed-in account area
(Licenses & credits, People, Devices, Configurations, Billing, etc.). It is the
primary authenticated surface for customers, so its load time is the first thing
a signed-in user experiences.

### How it loads (frontend architecture)
To avoid a fan-out of slow calls, the account area was built around **one
bundled endpoint, `get_account_dashboard`**, which server-side parallelizes the
pieces it needs (`user_account_info` + `accounts` + `organizations` +
`license_overview`, plus `streaming_credits` for the first account). The
frontend:
1. Reads a `sessionStorage` cache for an instant first paint when present, and
   revalidates in the background.
2. On a cache miss (first visit, new session, cleared cache, or right after a
   deploy), it must wait for `get_account_dashboard` before it can render.

Crucially, the **entire account view is hidden behind a "Loading your account…"
spinner until `get_account_dashboard` resolves** (the reveal is gated on that
promise). So the perceived load time of the whole page ≈ the latency of that one
call on a cache miss.

### What we observed (prod console, signed in as athompson@winnipeg.ca)
- The page sat on "Loading your account…" for several seconds, and occasionally
  appeared to hang there.
- Multiple Cloud Function calls on load: `get_account_dashboard`,
  `get_user_account_info`, and per-org `get_team_configurations`.
- `get_team_configurations` returned **403 (Forbidden)** for org `33526989`
  (Winnipeg Police Service) — logged as `get_team_configurations failed for
  33526989 Error: Forbidden`.
- `get_user_account_info` succeeded (`userStatus: approved`).

### Why it's slow / sometimes stuck
The dominant factor is **Cloud Functions cold starts**: when a function is idle
it must spin up (multi-second) before running any logic. Because the page reveal
is gated on `get_account_dashboard`, a cold start there directly becomes a long
spinner. If that request *stalls* (network or backend), the gating promise never
settles and the spinner stays up indefinitely.

### What the frontend already changed (so you don't need to)
We bounded the hang on the client so it can't wait forever:
- `eeDashboard.fetch` now aborts `get_account_dashboard` after **20s** (frees the
  in-flight promise so the fallback path can run).
- The reveal now races the dashboard promise against an **8s timeout**, so the
  page shell appears within a few seconds even on a cold start; individual
  sections keep their own spinners and fill in when the data lands.

That removes the "stuck forever" failure and caps the worst case — but it does
**not** make a cold start fast. Eliminating the underlying latency is the backend
part below.

## Instructions / ideas

### 1. Keep the hot account endpoints warm (highest impact)
Set **`min_instances >= 1`** on `get_account_dashboard` so there is always a warm
instance and signed-in users don't pay cold-start latency on the main account
page. Strongly recommended for `get_account_dashboard` at minimum; consider it
for the other endpoints the account area hits on load too:
`get_user_account_info`, `list_account_billing`, `get_team_configurations`,
`list_account_devices`.
- Gen-2 / Cloud Run functions expose `min_instances`.
- Trade-off: a small always-on cost per kept-warm instance. For the primary
  signed-in page this is almost certainly worth it. Even `min_instances = 1` on
  just `get_account_dashboard` should remove most of the visible slowness.

### 2. `get_team_configurations` 403 for funding-account admins
On load the page fetches `get_team_configurations` per org. For a user who is a
**billing admin of the account that funds an org but is not an org member**
(observed: `athompson@winnipeg.ca` for org `33526989`), it returns **403** — a
wasted round-trip plus a console error on every load. Pick one:
- **(a)** Authorize billing admins of the funding account to read that org's
  team configurations (likely the correct behavior, since they manage/fund it),
  **or**
- **(b)** If org-members-only is intended, add a per-org `can_view_configurations`
  boolean to the `get_account_dashboard` `organizations[]` payload so the
  frontend can skip the call (and the 403) for orgs the user can't read.

Either way the goal is to stop issuing a request that's guaranteed to 403.

### 3. (Optional) Redundant `get_user_account_info` call
The page calls `get_user_account_info` separately even though
`get_account_dashboard` already bundles `user_account_info`. If the bundled field
already carries everything `get_user_account_info` returns (status + form_data),
the separate call can be dropped — one fewer cold-startable round-trip on load.
This is partly a frontend change; please confirm whether the bundled
`user_account_info` is a complete substitute (same `userStatus` + `form_data`).

## Priority
1. **min_instances on `get_account_dashboard`** — the single biggest win for the
   "really slow" complaint.
2. **Resolve the `get_team_configurations` 403** — removes a recurring failed
   call on every load.
3. Optional dedupe of `get_user_account_info`.
