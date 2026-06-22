# Backend: let team members buy streaming credits on the account

## Context
Today the purchase flow is **owner-only**: `preview_cart` and `create_purchase_checkout`
require the caller to be an owner/admin of the `account_id` in the payload, and the
frontend hides the whole page from non-owners.

We're changing the policy so that **any member of a team (organization) funded by the
account can top up streaming credits for that account**, while licenses, device add-ons,
new licenses, and subscriptions stay owner-only. This matches the roles model we now show
in the app ("Members can top up livestreaming credits"; "Admins purchase & renew licenses,
add devices, see billing").

The frontend has already shipped its half (see "Frontend behavior" below): members now see
the full purchase page, can only build a **credits-only** cart, and can press **Pay now**.
That call will currently be rejected by the owner-only check. This doc is the backend change
needed to let it through.

## Endpoints in scope
Both are POST, JSON body, `Authorization: Bearer <Firebase ID token>`:
- `preview_cart` — `https://preview-cart-rvoe3nzu5q-uc.a.run.app`
- `create_purchase_checkout` — `https://create-purchase-checkout-rvoe3nzu5q-uc.a.run.app`

Request body (unchanged):
```json
{
  "account_id": 12345,
  "items": [ { "sku": "streaming_topup_payg", "amount_usd": 50 } ],
  "is_emulator": false
}
```

## SKU classification
- **Credit SKUs (member-allowed):** `streaming_topup_payg` (carries `amount_usd`),
  `streaming_topup_pro_bundle`.
- **Owner-only SKUs (unchanged):** `license_renewal`, `additional_devices`, `license_new`,
  and any subscription SKUs.

## Required authorization change
Replace the current "caller must be owner of `account_id`" gate on **both** endpoints with:

> **Allow** when the caller is an **owner/admin of the account**
> **OR** ( the caller is a **member of an organization funded by `account_id`**
> **AND every item in `items` is a credit SKU** ).
>
> **Reject** otherwise. In particular, reject a cart from a non-owner if it contains **any**
> non-credit SKU.

Definitions:
- *Owner/admin of the account*: existing check (account `members`/`members_display` role is
  owner/admin, or `is_site_admin`).
- *Member of an org funded by the account*: the caller's email is in the membership of at
  least one organization whose funding account is `account_id`. This is the same
  account→orgs→members relationship already exposed in `get_account_dashboard`
  (`account.organization_ids` → those orgs' member lists).

Credits always apply to the **account-level** balance for `account_id` (not a specific
license). The frontend sends no `license_id` on credit items.

## Error contract
- Non-owner with a cart containing owner-only SKUs → return a distinct, user-readable error,
  e.g. `code: "owner_required_for_items"` with a message naming the action ("Renewing
  licenses and adding devices are account-owner actions."). The frontend surfaces
  `err.data.message` verbatim.
- Keep returning the existing `billing_address_required` code where relevant, but see the
  billing-address note below.

## Things to decide / watch
1. **Billing address.** Setting an account's billing address is owner-only, but
   `preview_cart` can return `billing_address_required`. If a member tops up an account that
   has no billing address on file, they'd hit a wall they can't fix. Preferred: for a
   credits-only cart let Stripe Checkout collect the address (don't hard-require a
   pre-saved one); otherwise return an error that tells the member to ask an owner rather
   than the generic "Add a billing address to this account first."
2. **Receipts.** Email the receipt to the **purchaser** (the member who checked out), not
   only the account owner. The app's billing copy now reads "Receipts are also emailed to
   the purchaser."
3. **Audit.** Record the purchasing member's identity against the account's credit top-up so
   owners can see who bought what.
4. **Defense in depth.** The frontend blocks members from adding owner-only items (UI badges
   + deep-link filtering), but the server check above is the real enforcement point. Don't
   rely on the client.

## Frontend behavior (already shipped, for reference)
`purchase.html`:
- Members see the full page (no more lock-out panel).
- Catalog rows for Renew / Add devices / Buy new license render disabled with an
  "Admins only" badge for non-owners; "Add streaming credits" is open to everyone.
- `?add=...` deep links are filtered to credit SKUs for non-owners, so a member's cart can
  only ever be credits-only.
- `account_id` in the payload is the member's active (funding) account.

### One-line summary
> On `preview_cart` and `create_purchase_checkout`, allow non-owner callers who are members
> of an org funded by `account_id` to purchase **credits-only** carts
> (`streaming_topup_payg` / `streaming_topup_pro_bundle`) against the account balance; keep
> everything else owner-only, email the receipt to the purchaser, and don't trap members on
> the owner-only billing-address requirement.
