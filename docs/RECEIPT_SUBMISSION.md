# Receipt Submission — Complete Setup & Reference

This document describes the **receipt submission** feature end to end: what it
does, every component, where the code lives, how it is configured, how it was
deployed, how to test it, and how to maintain or change it.

_Last updated: 2026-06-24._

---

## 1. What it does

Advanced RPAS Course class members visit a web page, enter their **name,
email, and organization**, and upload a **receipt** (PDF or image). When they
submit:

1. The file is saved to a shared **Google Drive folder**, automatically named
   `Name_Organization_email_YYYY-MM-DD.ext`.
2. A row is appended to a **Google Sheet** (with a date/time stamp).
3. The submission is recorded in a **Firestore** collection.
4. An **email notification** is sent to `info@eagleeyessearch.com` with all the
   details and a link to the file.

It reuses the same architecture as the free-trial email feature: a static page
that POSTs to a Firebase Cloud Function, with email sent server-side through the
Firestore "Trigger Email" extension.

---

## 2. Architecture at a glance

```
  Browser (/submit-receipt/)
        │  POST JSON { name, email, organization, fileName, mimeType, fileData(base64), honeypot }
        ▼
  Cloud Function:  receipt_submission   (Python 3.13, gen 2, us-central1)
        │
        ├──► Google Drive  → saves the file (renamed) to the shared folder
        ├──► Google Sheet  → appends a row (auto-creates header row)
        ├──► Firestore     → records doc in `receipt_submissions`
        └──► Firestore `mail` collection → Trigger Email extension → emails info@
```

All Google access (Drive + Sheets) is performed by the project's **service
account**, which must be granted access to the folder and the sheet.

---

## 3. Key identifiers

| Thing | Value |
|---|---|
| GCP / Firebase project | `eagleeyessearch` |
| Service account (does the uploading) | `eagleeyessearch@appspot.gserviceaccount.com` |
| Cloud Function name | `receipt_submission` |
| Function region / runtime | `us-central1` · Python 3.13 · 2nd gen |
| Function URL | `https://us-central1-eagleeyessearch.cloudfunctions.net/receipt_submission` |
| Web page (live) | `https://www.eagleeyessearch.com/submit-receipt/` |
| Google Drive folder | `1PBIwHtyeVhrAN8c_GZPV5t3KQbcTBS_S` |
| Google Sheet | `17KVBp9dKUW0QBn3KarqpeSht-qFVecj1kEMc0OYYFlo` |
| Notification recipient | `info@eagleeyessearch.com` |
| Firestore collection | `receipt_submissions` |

Folder: <https://drive.google.com/drive/folders/1PBIwHtyeVhrAN8c_GZPV5t3KQbcTBS_S>
Sheet: <https://docs.google.com/spreadsheets/d/17KVBp9dKUW0QBn3KarqpeSht-qFVecj1kEMc0OYYFlo/edit>

---

## 4. Code: where everything lives

### Website (`petered/eagle_eyes_website`, branch `receipt-submission`)
- **`submit-receipt.html`** — the page (Jekyll, `layout: main`,
  `permalink: /submit-receipt/`). Contains the form, styling, validation, and
  the JS that base64-encodes the file and POSTs to the function.
- **`docs/RECEIPT_SUBMISSION.md`** — this document.

### Cloud Functions (`petered/eagle_eyes_firebase_functions`, branch `receipt-submission`)
- **`functions/licensing/firestore_helpers/request_handlers.py`** — the
  `receipt_submission` handler plus helpers:
  - `_upload_receipt_to_drive()` — uploads to Drive.
  - `_append_receipt_to_sheet()` — appends to the Sheet (creates headers).
  - `_receipt_notification_email()` — builds the email (text + HTML).
  - `_receipt_file_extension()`, `_safe_filename_part()` — filename helpers.
  - Constants: `RECEIPTS_DRIVE_FOLDER_ID`, `RECEIPTS_SHEET_ID`,
    `RECEIPT_SHEET_HEADERS`, `RECEIPT_MAX_BYTES`.
- **`functions/main.py`** — imports and registers `receipt_submission`.
- **`functions/requirements.txt`** — adds `google-api-python-client` (Drive +
  Sheets API client).

> The `licensing` submodule branch `receipt-submission` is based on
> `free-trial-email-capture`, because it reuses `send_email_to_user(..., reply_to=...)`
> introduced there. If rebasing onto a clean `main`, that helper must be present.

---

## 5. The web page

- **URL:** `/submit-receipt/`
- **Fields:** Full name, Email, Organization, Receipt file.
- **Validation (client-side):**
  - Every field is `required` (browser blocks empty submit).
  - JS backstop checks each field individually with a clear message.
  - Email must match a basic `x@y.z` pattern.
  - File must be a **PDF or image** (JPG, PNG, HEIC, WEBP, GIF, TIFF).
  - File must be non-empty and **≤ 8 MB**.
- On success it shows a green "Receipt received ✓" confirmation.
- A hidden **honeypot** field deters bots (if filled, the function rejects).

The page sends the file as **base64 JSON** to `getHostUrl() + "/receipt_submission"`.
`getHostUrl()` (defined in `_includes/head.html`) returns the production
Cloud Functions host unless the page is opened with `?is_emulator=true`.

---

## 6. The Cloud Function (`receipt_submission`)

**Request (POST JSON):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "organization": "Acme SAR",
  "honeypot": "",
  "fileName": "receipt.pdf",
  "mimeType": "application/pdf",
  "fileData": "<base64, no data: prefix>"
}
```

**Behaviour:**
1. Handles CORS preflight (`OPTIONS`).
2. Rejects if honeypot is filled, fields missing, email invalid, or file
   missing/over 8 MB.
3. Builds the filename: `Name_Organization_email_YYYY-MM-DD.ext`
   (sanitized for Drive).
4. Uploads to the Drive folder.
5. Appends a row to the Sheet (creates the header row if the sheet is empty).
6. Records the submission in Firestore `receipt_submissions`.
7. Emails `info@eagleeyessearch.com` (Reply-To = submitter).
8. Returns `200 "Receipt received"`.

**Configuration overrides (optional env vars):**
- `RECEIPTS_DRIVE_FOLDER_ID` — change the Drive folder without editing code.
- `RECEIPTS_SHEET_ID` — change the logging sheet.

---

## 7. Google Sheet logging

The function appends one row per submission and creates the header row
automatically on first write. Columns:

| Date/Time (UTC) | Name | Email | Organization | File Name | Drive Link |
|---|---|---|---|---|---|

The sheet append is **non-fatal**: if it fails, the file is still in Drive and
the email still sends; the error is logged.

---

## 8. The notification email

- **To:** `info@eagleeyessearch.com`  •  **Reply-To:** the submitter
- **Subject:** `New receipt submitted — {name} ({organization})`
- **Body (text):**
  ```
  A new receipt was submitted through the Eagle Eyes website.

  Name:          {name}
  Email:         {email}
  Organization:  {organization}
  Submitted:     {YYYY-MM-DD HH:MM UTC}
  File:          {filename}

  View the receipt in Google Drive:
  {drive_link}
  ```
- An HTML version with a "View receipt in Drive" button is also sent.
- Sending mechanism: a document is written to the Firestore `mail` collection,
  which the **Trigger Email** Firebase extension picks up and delivers.

---

## 9. One-time setup (what makes it work)

These were performed against the `eagleeyessearch` project. You need `gcloud`
and the `firebase` CLI, logged in as a project owner/editor.

### 9.1 Find the service account email
```bash
gcloud secrets versions access latest --secret=eagle_eyes_service_account_key \
  --project=eagleeyessearch \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['client_email'])"
# → eagleeyessearch@appspot.gserviceaccount.com
```

### 9.2 Share the Drive folder
Open the folder → **Share** → add `eagleeyessearch@appspot.gserviceaccount.com`
as **Editor** (uncheck "Notify people").

### 9.3 Share the Google Sheet
Open the sheet → **Share** → add `eagleeyessearch@appspot.gserviceaccount.com`
as **Editor** (uncheck "Notify people").

### 9.4 Enable the required Google APIs
- Google Drive API: <https://console.cloud.google.com/apis/library/drive.googleapis.com?project=eagleeyessearch>
- Google Sheets API: <https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=eagleeyessearch>

### 9.5 Deploy the function
```bash
cd ~/projects/eagle_eyes_firebase_functions/functions

# one-time: create the local venv Firebase uses to analyze the code
python3.13 -m venv venv
./venv/bin/pip install -r requirements.txt

firebase login            # if the token has expired
firebase use eagleeyessearch
firebase deploy --only functions:receipt_submission --project eagleeyessearch
```
> A trailing warning about an Artifact Registry "cleanup policy" is harmless.
> To silence it later: `firebase functions:artifacts:setpolicy`.

### 9.6 Publish the web page
Merge the website `receipt-submission` branch to `master` (after the function is
deployed). Live at `https://www.eagleeyessearch.com/submit-receipt/`.

---

## 10. Testing

1. Open `/submit-receipt/` (live, or locally via `bundle exec jekyll serve`).
2. Fill in name/email/org, attach a small PDF or photo, click **Upload receipt**.
3. Expect the green "Receipt received ✓" screen.
4. Verify:
   - **Drive** — the renamed file appears in the folder.
   - **Sheet** — a new row with the timestamp and details.
   - **Email** — `info@` receives the notification.
   - **Firestore** — a doc in `receipt_submissions`; the outgoing mail in `mail`.

---

## 11. Troubleshooting

- **Function logs:**
  <https://console.cloud.google.com/functions/details/us-central1/receipt_submission?project=eagleeyessearch&tab=logs>
- **File didn't reach Drive** → the folder isn't shared with the service
  account, or the Drive API isn't enabled.
- **Row didn't reach the Sheet** → the sheet isn't shared with the service
  account, or the Sheets API isn't enabled. (Drive + email still work; check
  logs for `failed to append to sheet`.)
- **No email** → check the Firestore `mail` collection and the Trigger Email
  extension; confirm `send_email_to_user` exists (free-trial branch dependency).
- **Page shows "Something went wrong"** → the function returned non-200; check
  logs. Common causes: missing field, oversized file, or backend not deployed.

---

## 12. Maintenance / how to change things

| To change… | Do this |
|---|---|
| The Drive folder | Set env var `RECEIPTS_DRIVE_FOLDER_ID`, or edit the constant; re-share the new folder with the service account. |
| The logging sheet | Set env var `RECEIPTS_SHEET_ID`, or edit the constant; re-share the new sheet. |
| Sheet columns | Edit `RECEIPT_SHEET_HEADERS` and the row built in the handler. |
| Email wording / recipient | Edit `_receipt_notification_email()` / the `send_email_to_user(email=...)` call. |
| File size limit | Edit `RECEIPT_MAX_BYTES` (function) and `RECEIPT_MAX_BYTES` (page). |
| Allowed file types | Edit the accept attribute + JS type check on the page. |
| Filename format | Edit the `filename = ...` line in the handler. |

After any function change: redeploy with the command in §9.5.

---

## 13. Security notes

- Spam protection is **honeypot-only** — the endpoint accepts any well-formed
  submission. A per-email/IP rate limit could be added if abuse appears.
- The service account has access only to the **specific** folder and sheet it
  was shared with — not the rest of anyone's Drive.
- No credentials live in the web page or the repo; all Google access uses the
  service account key stored in Secret Manager (`eagle_eyes_service_account_key`).
