// ============================================================
//  RPAS Quiz — site configuration
// ============================================================
//
//  BASE_URL is the public address where this site will live.
//  The QR codes and quiz links are built from it.
//
//  While testing locally you can leave it blank ("") — links
//  will just work relative to wherever the files are opened.
//
//  Once you deploy to a free host, set this to your real URL,
//  e.g.  "https://rpas-course.netlify.app"
//  (no trailing slash), then re-run generate_qr.py.
//
const CONFIG = {
  BASE_URL: "https://www.eagleeyessearch.com/advanced-quiz",  // folder URL (no trailing slash)
  COURSE_NAME: "Eagle Eyes — Advanced RPAS Course",

  // Optional — paste your Google Apps Script web-app URL here to collect
  // results in a Google Sheet. Leave "" to keep quizzes fully anonymous
  // (no "Save your results" box appears). See google-apps-script.gs.
  RESULTS_URL: "https://script.google.com/macros/s/AKfycbyGSgt6DJPDwNyK33WGUraewnxJU263fUVi7nXwtdvyvgODCnYwB3DKYgo468Qtbyst/exec",
};

// Make available to both the browser and Node (for the QR script).
if (typeof module !== "undefined") { module.exports = CONFIG; }
