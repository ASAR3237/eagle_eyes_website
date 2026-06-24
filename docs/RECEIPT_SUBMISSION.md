# Receipt submission feature

Lets Advanced RPAS Course class members upload a receipt (PDF or image). The
file is saved to a shared Google Drive folder and the team is emailed a
notification. Mirrors the free-trial email flow (page → Cloud Function →
email via the Firestore `mail` / Trigger-Email extension).

## Flow

1. Visitor opens **`/submit-receipt/`**, enters name / email / organization and
   picks a PDF or image (≤ 8 MB).
2. The page base64-encodes the file and `POST`s JSON to the
   **`receipt_submission`** Cloud Function (same `getHostUrl()` pattern as
   free-trial).
3. The function:
   - validates the fields + honeypot,
   - saves the file to the shared **Google Drive folder**, auto-named
     `name_organization_email_date.ext`,
   - records the submission in the `receipt_submissions` Firestore collection,
   - emails **info@eagleeyessearch.com** the details + a Drive link
     (`Reply-To` = the submitter).

## Code

**Website** (`petered/eagle_eyes_website`, branch `receipt-submission`)
- `submit-receipt.html` — the page (Jekyll, `layout: main`, `permalink: /submit-receipt/`).

**Functions** (`petered/eagle_eyes_firebase_functions`, branch `receipt-submission`)
- `functions/licensing/firestore_helpers/request_handlers.py` — `receipt_submission`
  handler + `_upload_receipt_to_drive`, `_receipt_notification_email`,
  `_receipt_file_extension`, `_safe_filename_part`, `RECEIPTS_DRIVE_FOLDER_ID`.
- `functions/main.py` — import + registration.
- `functions/requirements.txt` — adds `google-api-python-client`.

> The licensing submodule branch `receipt-submission` is based on
> `free-trial-email-capture`, because it reuses `send_email_to_user(..., reply_to=...)`
> added there. **Merge `free-trial-email-capture` first**, then this branch.

## Deploy checklist (Firebase owner)

1. **Share the Drive folder** `1PBIwHtyeVhrAN8c_GZPV5t3KQbcTBS_S`
   ([link](https://drive.google.com/drive/folders/1PBIwHtyeVhrAN8c_GZPV5t3KQbcTBS_S))
   with the **service account email** behind the `eagle_eyes_service_account_key`
   secret (give it Editor/Content-manager). The function uploads as that SA.
2. **Enable the Google Drive API** in the `eagleeyessearch` GCP project.
3. Merge `free-trial-email-capture` (dependency), then merge the
   `receipt-submission` submodule branch, bump the submodule pointer, merge the
   parent `receipt-submission` branch.
4. `firebase deploy --only functions:receipt_submission`
5. Merge the website `receipt-submission` branch **last** (the form errors
   against an undeployed endpoint).

Endpoint once deployed:
`https://us-central1-eagleeyessearch.cloudfunctions.net/receipt_submission`

Optional: set env var `RECEIPTS_DRIVE_FOLDER_ID` to point at a different folder
without a code change.

## The notification email (draft — iterate freely)

Sent to `info@eagleeyessearch.com`, `Reply-To` = submitter.

**Subject:** `New receipt submitted — {name} ({organization})`

**Body:**
```
A new receipt was submitted through the Eagle Eyes website.

Name:          {name}
Email:         {email}
Organization:  {organization}
Submitted:     {YYYY-MM-DD HH:MM UTC}
File:          {name_organization_email_date.ext}

View the receipt in Google Drive:
{drive_link}

The file has been saved to the shared receipts folder in Google Drive.
```
(An HTML version with a "View receipt in Drive" button is also sent.)

## Notes / open items

- **Spam protection is honeypot-only** (same as free-trial). The endpoint will
  accept any well-formed submission.
- **Email links to the file** rather than attaching it. If you'd prefer the
  receipt attached to the email too, `send_email_to_user` would need an
  `attachments` field (Trigger-Email supports it) — small follow-up.
- **8 MB cap** enforced on both the page and the function. Firebase HTTP
  functions accept up to ~10–32 MB requests; base64 inflates ~33%.
- Local end-to-end test: Firebase emulator + `?is_emulator=true` on the page
  (per the free-trial emulator path).
