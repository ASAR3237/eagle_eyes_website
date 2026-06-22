# Backend: make billing history Admin-only

## Context
The Purchase history page (`/account/billing/`) shows an account's invoices,
receipts, and charges. Per the roles model, **only an Admin (owner) of the
account may see billing history** ("See billing history and invoices" is in the
Admin permission list; Members do not get it).

The frontend now gates this page client-side: a non-Admin of the active account
sees a block message instead of the timeline, and the sidebar item is hidden for
non-admins. But that's only UX. The data itself is served by an endpoint that
must enforce the same rule server-side.

## Endpoint to change
`list_account_billing?account_id=<id>` (GET, `Authorization: Bearer <Firebase ID token>`)

Currently it returns the account's billing timeline to (at least) any member of
the account. It must instead return the data **only when the caller is an
Admin/owner of `account_id`**.

> **Authorize** when the caller is an **owner/admin of `account_id`** (the
> account `members` / `members_display` map lists the caller's email with role
> `owner`/`admin`, or the caller is `is_site_admin`).
>
> Otherwise **reject with 403** (and an empty/again-gated body, not the items).

This is the same "owner/admin of the account" check already used to gate
purchasing; reuse it. No change to the response shape for authorized callers.

### One-line summary
> Gate `list_account_billing` to account Admins/owners only; return 403 to
> members. Mirrors the Admin-only billing-history rule the UI now enforces.
