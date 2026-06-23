# Backend: make outbound frontend links match the site they came from

## Problem

Several backend-generated links/redirects are hardcoded (or default) to the
production frontend, so flows started from a non-production frontend (staging,
local) send users to production:

- **Invite accept link is fully hardcoded.**
  `firestore_helpers/invite_endpoints.py:56`
  ```python
  ACCEPT_URL_BASE = "https://www.eagleeyessearch.com/invite/accept/"
  ```
  An invite created from staging emails a `www.eagleeyessearch.com/...` link.

- **Stripe checkout redirects default to prod unless localhost.**
  `firestore_helpers/stripe_request_handlers.py:57` `get_redirect_url_from_request`
  uses `base_url = 'https://eagleeyessearch.com'` and only swaps to the request
  `Origin` when it's localhost + a valid `dev_token`. So staging checkouts
  (purchase / streaming / training / post-payment) redirect to **production**.

- **Renewals already adapt** (`renewal_endpoints.py:232`: `origin = req.headers.get("Origin") or "https://www.eagleeyessearch.com"`), but trust any Origin (no allowlist).

## Goal

Outbound links should point back to the frontend that initiated the request
(staging → staging, prod → prod, local → local), with production as the safe
default, and without enabling open-redirect / phishing.

## Recommended approach: allowlisted base URL

The frontend already knows its own absolute base (`window.location.origin` plus
its Jekyll `baseurl`). Two equivalent options - pick one:

**Option A (preferred): frontend passes its base, backend validates.**
- Frontend includes `frontend_base_url` in the `invite_member` (and checkout)
  request bodies, set to `location.origin + "{{ site.baseurl }}"`.
- Backend validates it against an allowlist; if allowed, use it, else fall back
  to prod. Centralize in one helper:
  ```python
  ALLOWED_FRONTEND_BASES = {
      "https://www.eagleeyessearch.com",
      "https://eagleeyessearch.com",
      # staging - CONFIRM exact host + sub-path; the staging repo builds with
      # url=https://eagle-eyes-search.github.io and a Pages project base path,
      # so the base may be e.g. https://eagle-eyes-search.github.io/eagle_eyes_website_staging
  }
  DEFAULT_FRONTEND_BASE = "https://www.eagleeyessearch.com"

  def frontend_base(req) -> str:
      cand = (req.get_json(silent=True) or {}).get("frontend_base_url") \
             or req.headers.get("Origin")
      cand = (cand or "").rstrip("/")
      return cand if cand in ALLOWED_FRONTEND_BASES else DEFAULT_FRONTEND_BASE
  ```
  Why this and not Origin alone: staging is served under a **sub-path**
  (`/eagle_eyes_website_staging`), so the `Origin` header (host only) is not
  enough to build a correct URL there. The frontend-provided base carries the
  sub-path; the allowlist keeps it safe.

**Option B: Origin header + host→base map** (use if you'd rather not touch the
frontend). Map each allowed Origin host to its full base prefix (prod → "",
staging host → "/eagle_eyes_website_staging").

## Apply it in these spots

1. **Invites** (`invite_endpoints.py`): build the link from the resolved base:
   ```python
   base = frontend_base(req)              # passed through from invite_member's req
   link = f"{base}/invite/accept/?token={token}"
   ```
   (Thread the resolved base into `_send_invite_email` instead of the module-level
   `ACCEPT_URL_BASE` constant.)

2. **Checkout redirects** (`stripe_request_handlers.py:get_redirect_url_from_request`):
   replace the localhost-only logic with `frontend_base(req)` so staging/local get
   their own success/cancel URLs. Keep prod as the default.

3. **Renewals** (`renewal_endpoints.py:232`): swap the raw `Origin` for
   `frontend_base(req)` so it shares the same allowlist.

## Notes / confirm

- **Security:** the allowlist is the key safeguard - never reflect an arbitrary
  `Origin`/`frontend_base_url` into an email link or Stripe redirect.
- **Backward compatible:** default stays production, so prod behavior is unchanged.
- **Staging host:** the staging repo currently has `CNAME = www.eagleeyessearch.com`
  (same as prod) but its deploy config sets `url=https://eagle-eyes-search.github.io`.
  Please confirm the actual host/base the staging site serves from, then add it to
  `ALLOWED_FRONTEND_BASES`.
- These are email/redirect links that don't carry an account-scoped secret, so the
  allowlist (not the value itself) must be trusted.

## Frontend side (small, can ship with the account-area deploy)

If Option A: add `frontend_base_url: location.origin + "{{ '' | relative_url }}".replace(/\/$/, "")`
(or the site baseurl) to the `invite_member` request in `account.html` and to the
purchase/streaming checkout requests in `purchase.html`. No change needed if Option B.
