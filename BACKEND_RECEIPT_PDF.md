# Backend: surface a downloadable PDF for card-payment rows

## Symptom
On the Purchase history page a paid purchase shows as a **"Card payment"** row
with only a **"View receipt"** action (Stripe's hosted HTML receipt). There is no
"Download PDF". Saving the receipt page yields an `.html` file, not a PDF.

## Cause
`list_account_billing` returns this payment as a **charge** (`type: "charge"`),
and `_normalize_charge` only exposes `receipt_url` (Stripe's HTML receipt page).
The downloadable PDF lives on the **invoice** (`invoice_pdf`), but no invoice row
is being returned for this payment, so the frontend has no `pdf_url` to offer.

Checkout already sets `invoice_creation.enabled = true`, so an invoice generally
exists. It isn't reaching the timeline because the invoice fetch
(`Invoice.list(customer=cid)` + `Invoice.search(metadata.eagle_eyes_account_id)`)
doesn't match it — most likely a Stripe-customer-id mismatch (canonical-customer
consolidation) or the invoice lacking the `eagle_eyes_account_id` metadata. Also
note the de-dupe `invoice_charge_ids = {inv.charge for inv in invoices}` relies on
`Invoice.charge`, which is null on newer Stripe API versions.

## Fix (robust, low-risk)
In `_normalize_charge`, when the charge is linked to an invoice, attach that
invoice's PDF so a charge row can offer a download even when the invoice isn't
fetched separately:

```python
def _normalize_charge(ch) -> dict:
    pdf_url = None
    hosted_url = None
    inv_id = getattr(ch, "invoice", None)          # set when an invoice exists
    if inv_id:
        try:
            inv = stripe.Invoice.retrieve(inv_id)
            pdf_url = inv.invoice_pdf
            hosted_url = inv.hosted_invoice_url
        except Exception:
            pass
    return {
        "type": "charge",
        ...
        "receipt_url": ch.receipt_url,
        "pdf_url": pdf_url,        # NEW
        "hosted_url": hosted_url,  # NEW (optional)
        ...
    }
```

The frontend already renders **"Download PDF"** on a charge row when `pdf_url` is
present (billing.html), so no further frontend change is needed.

### Also worth doing (cleaner long-term)
- De-dupe charge↔invoice by PaymentIntent instead of the deprecated
  `Invoice.charge` (e.g. match `charge.payment_intent` to `invoice.payment_intent`),
  so the invoice row (with its PDF) replaces the charge row.
- Make sure invoice fetching covers invoices created by `invoice_creation`
  (confirm they carry `eagle_eyes_account_id` metadata, or fetch by the same
  PaymentIntent/customer used at checkout).

### One-line summary
> In `_normalize_charge`, look up `charge.invoice` and include its `invoice_pdf`
> as `pdf_url` so card-payment rows expose a downloadable PDF; the frontend
> already shows a "Download PDF" link when `pdf_url` is set.
