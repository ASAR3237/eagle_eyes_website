# Backend: "You're not a member of any organization" shows for real members

## Symptom

On the account Profile page, a user who *is* a member/admin of an org sees
"You're not a member of any organization." The frontend is correct — it just
renders what `get_my_organization` returns (an empty `organizations` list).

## Root cause (most likely): membership read off a stale projection

`get_my_organization` (organization_endpoints.py:767-772) decides membership by
checking the **legacy projected arrays** `emails` / `admin_emails`:

```python
for doc in db.collection("organizations").stream():
    data = doc.to_dict() or {}
    emails = data.get("emails") or []
    admin_emails = data.get("admin_emails") or []
    if caller_email not in emails and caller_email not in admin_emails:
        continue
```

But the **source of truth is the `members` map** (email → role). `emails` /
`admin_emails` are *projections* of `members` (see
`project_emails_from_members` / `project_admin_emails_from_org_members` in
permissions.py). Any write path that updates `members` without re-projecting
those arrays — or any org created/migrated before the projection existed —
leaves `emails`/`admin_emails` stale, so a genuine member in `members` is missed.

Normalization is NOT the issue: both write (`accept_org_invite`,
invite_endpoints.py:347 `normalize_email(user["email"])`) and read
(`get_my_organization`, :763 `normalize_email(user["email"])`) lowercase+strip
identically, and `members` keys are normalized emails too. So this is a
projection-drift problem, not a casing problem.

## Fix

**1. Read membership from `members` (source of truth), not the projected arrays.**
In `get_my_organization`:

```python
members = data.get("members") or {}
role = members.get(caller_email)
if role is None:
    # fall back to legacy arrays for not-yet-migrated orgs
    if caller_email not in (data.get("emails") or []) \
       and caller_email not in (data.get("admin_emails") or []):
        continue
    role = ORG_ROLE_ADMIN if caller_email in (data.get("admin_emails") or []) else ORG_ROLE_MEMBER
...
"is_admin": role == ORG_ROLE_ADMIN,
```

This makes the read authoritative and keeps backward-compat for orgs that only
have the legacy arrays.

**2. Keep the projections in sync on every `members` write.**
Audit every path that mutates `organizations/*.members` (accept_org_invite does
re-project; also check role changes, remove-member, add-account-member,
migrations) and ensure each one also writes
`emails = project_emails_from_members(members)` and
`admin_emails = project_admin_emails_from_org_members(members)`.

**3. One-off migration to repair existing drift.**
For every org doc, re-derive `emails`/`admin_emails` from `members` and write
them back, so already-broken orgs are fixed even before all write paths are
audited.

## How to confirm the specific case first

Before the code fix, check the actual org doc for the affected user:
- Is the user's normalized email a key in `organizations/<id>.members`? If yes
  but it's missing from `.emails`/`.admin_emails`, that's the drift above (fix #1
  resolves it).
- If it's in neither, the accept never completed for this email, OR the user is
  signed in with a different email than the one that joined (e.g. they used two
  different accounts while testing) — that case is correct behavior, not a bug.

## Note

`get_my_organization` also does `int(data["id"])` per org (organization_endpoints.py:774);
if any org doc lacks an integer `id`, the whole endpoint 500s (frontend would
then show "Couldn't load organizations" rather than "not a member"). Worth a
guard while you're in here.
