# Backend: /account/ slow to load (and sometimes stuck) — cold starts

## Symptom

`/account/` often sits on "Loading your account…" for several seconds, and
occasionally hangs there. The whole account view reveal is gated on the
`get_account_dashboard` response.

## What the frontend already did

Bounded it so it can't hang forever: `eeDashboard.fetch` now aborts after 20s,
and the content reveal races the fetch against an 8s timeout (sections fill in
when data lands). That fixes the *stuck* case and caps the worst case — but the
page is still slow whenever the function cold-starts. That part is backend.

## Root cause

`get_account_dashboard` (and the other account endpoints) are Cloud Functions
that **cold-start** when idle — multi-second spin-up before any work runs. The
account page can't render until this returns, so cold starts = long spinners.

## Backend fixes

**1. Keep the hot account endpoints warm (biggest win).**
Set `min_instances >= 1` on `get_account_dashboard` so there's always a warm
instance and users don't pay cold-start. Strongly recommended for at least
`get_account_dashboard`; consider it too for the other endpoints the account
area hits on load: `get_user_account_info`, `list_account_billing`,
`get_team_configurations`, `list_account_devices`.
(Gen-2 / Cloud Run functions: `min_instances`. Trade-off: a small always-on cost
per kept-warm instance — worth it for the primary signed-in page.)

**2. `get_team_configurations` returns 403 for funding-account admins.**
On load the page calls `get_team_configurations` per org. For a user who is a
**billing admin of the account that funds an org but not an org member**
(e.g. `athompson@winnipeg.ca` for org `33526989` / Winnipeg Police Service) it
returns **403**, a wasted round-trip + console error. Decide one:
  - (a) Authorize billing admins of the funding account to read that org's
    team configurations (likely correct, since they manage it), **or**
  - (b) Confirm it's intended (org-members only). If so, the dashboard could
    return a per-org `can_view_configurations` flag so the frontend skips the
    call (and the 403) for orgs the user can't read.

**3. (Optional) Redundant `get_user_account_info` call.**
The page calls `get_user_account_info` separately even though
`get_account_dashboard` already bundles `user_account_info`. If the bundled
field is sufficient, the separate call can be dropped (one fewer cold-startable
round-trip) — partly a frontend change; flag if the bundled payload already
carries everything `get_user_account_info` returns.

## Priority

#1 (min_instances on `get_account_dashboard`) is the single highest-impact
change for the "really slow" complaint. #2 removes a recurring 403 + wasted call.
