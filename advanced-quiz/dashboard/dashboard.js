// ============================================================
//  Advanced RPAS Course — instructor results dashboard
//  Reads ANONYMOUS aggregate tallies from the Apps Script
//  (JSONP) and turns them into "hardest questions first".
//  No names are ever transmitted or shown.
// ============================================================

(function () {
  "use strict";

  var root = document.getElementById("app");

  // Section titles present in the last render, so we can tell when a brand-new
  // section appears and auto-fold the older ones to surface the latest one.
  var prevTitles = null;

  // Apps Script web-app URL that serves the dashboard stats (the deployment
  // that has the ?stats endpoint). Submissions use CONFIG.RESULTS_URL; this
  // can be the same URL or a separate deployment — both read the same Sheet.
  var STATS_URL = "https://script.google.com/macros/s/AKfycbzsHaKCxUgTsPklL57i_-118F8JkxyxrzWkMEtjsOjocUan47qMsjBBPho4MlSQ0_Dr/exec";

  // title -> quiz definition (to map letters back to option text + answer key).
  // Sheet tab names have ":" etc. stripped (Google rule), so normalise both
  // sides before matching, e.g. "Section 4: Meteorology" == "Section 4  Meteorology".
  function normTitle(s) {
    return String(s).replace(/[:\\\/?*\[\]]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  }
  var byTitle = {};
  Object.keys(QUIZZES).forEach(function (id) { byTitle[normTitle(QUIZZES[id].title)] = QUIZZES[id]; });

  if (!STATS_URL) {
    root.innerHTML = '<div class="topbar"><h1>Dashboard unavailable</h1></div>' +
      '<div class="error">No results endpoint configured.</div>';
    return;
  }

  renderGate();

  // ----------------------------------------------------------
  function renderGate(msg) {
    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">Dashboard</p>' +
        '<h1>Advanced RPAS Course Quiz Results</h1>' +
        '<p>Aggregate results — where the class struggled most.</p>' +
      '</div>' +
      '<div class="card gate">' +
        '<label for="pass">Passphrase</label>' +
        '<input id="pass" type="password" autocomplete="off" placeholder="Enter dashboard passphrase">' +
        '<button class="btn btn-primary" id="go">View results</button>' +
        '<p class="savemsg ' + (msg ? 'err' : '') + '" id="gmsg">' + (msg || '') + '</p>' +
      '</div>';
    document.getElementById("go").addEventListener("click", submit);
    document.getElementById("pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    document.getElementById("pass").focus();
  }

  function submit() {
    var key = document.getElementById("pass").value.trim();
    if (!key) return;
    var msg = document.getElementById("gmsg");
    msg.className = "savemsg"; msg.textContent = "Loading…";
    loadStats(key, function (err, data) {
      if (err) { renderGate("Couldn't reach the results server — check your connection and try again."); return; }
      if (!data || data.error) { renderGate("Wrong passphrase."); return; }
      render(data, key);
    });
  }

  // ----------------------------------------------------------
  // JSONP — lets this static page read the Apps Script cross-origin.
  function jsonp(query, done) {
    var cbName = "eeqd_" + Date.now();
    var s = document.createElement("script");
    var t = setTimeout(function () { cleanup(); done(new Error("timeout")); }, 15000);
    window[cbName] = function (data) { cleanup(); done(null, data); };
    s.onerror = function () { cleanup(); done(new Error("neterr")); };
    s.src = STATS_URL + "?" + query + "&callback=" + cbName + "&_=" + Date.now();
    document.body.appendChild(s);
    function cleanup() {
      clearTimeout(t);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (s.parentNode) s.parentNode.removeChild(s);
    }
  }
  function loadStats(key, done) {
    jsonp("stats=1&key=" + encodeURIComponent(key), done);
  }
  function archiveData(key, done) {
    jsonp("archive=1&key=" + encodeURIComponent(key), done);
  }

  // ----------------------------------------------------------
  function render(data, key) {
    var quizzes = (data.quizzes || []).slice();

    // Show sections in course order (1..8), not Sheet-tab creation order.
    var qIndex = {};
    Object.keys(QUIZZES).forEach(function (id, i) { qIndex[normTitle(QUIZZES[id].title)] = i; });
    quizzes.sort(function (a, b) {
      var ai = qIndex[normTitle(a.title)]; if (ai == null) ai = 999;
      var bi = qIndex[normTitle(b.title)]; if (bi == null) bi = 999;
      return ai - bi;
    });

    // Titles in current render order (matches the .card.dash DOM order below).
    var curTitles = quizzes.map(function (qz) { return normTitle(qz.title); });
    var freshTitles = prevTitles
      ? curTitles.filter(function (t) { return prevTitles.indexOf(t) === -1; })
      : [];

    var html =
      '<div class="topbar">' +
        '<p class="eyebrow">Dashboard</p>' +
        '<h1>Advanced RPAS Course Quiz Results</h1>' +
      '</div>';

    if (!quizzes.length) {
      html += '<div class="card"><p class="msg" style="text-align:center;margin:20px 0;">' +
        'No submissions yet. Once students start finishing quizzes, results show up here.</p></div>';
    }

    quizzes.forEach(function (qz) {
      var meta = byTitle[normTitle(qz.title)];
      var niceTitle = meta ? meta.title : qz.title;
      html += '<div class="card dash collapsed">' +
        '<div class="dash-head" role="button" tabindex="0" aria-expanded="false">' +
          '<span class="dash-title"><span class="dash-chevron" aria-hidden="true"></span>' +
          '<h2>' + esc(niceTitle) + '</h2></span>' +
          '<span class="resp">' + qz.responses + ' response' + (qz.responses === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<div class="dash-body">' +
        '<div class="chart-scale"><span>0%</span><span>25%</span><span>50%</span>' +
        '<span>75%</span><span>100%</span></div>';

      var items = (qz.qs || []).map(function (q, idx) {
        var question = meta && meta.questions[idx];
        var hasKey = !!question;
        var correctLetter = hasKey ? String.fromCharCode(65 + question.answer) : null;
        var n = q.n || 0;
        var correctCount = correctLetter ? (q.picks[correctLetter] || 0) : 0;
        var pctWrong = (hasKey && n) ? Math.round((n - correctCount) / n * 100) : null;
        var pctCorrect = (hasKey && n) ? Math.round(correctCount / n * 100) : null;

        var mwLetter = null, mwCount = -1;
        Object.keys(q.picks || {}).forEach(function (L) {
          if (L === correctLetter) return;
          if (q.picks[L] > mwCount) { mwCount = q.picks[L]; mwLetter = L; }
        });
        var mwText = "";
        if (mwLetter && question) {
          var oi = mwLetter.charCodeAt(0) - 65;
          if (question.options[oi] != null) mwText = question.options[oi];
        }
        return {
          idx: idx, n: n, pctWrong: pctWrong, pctCorrect: pctCorrect, hasKey: hasKey,
          correctCount: correctCount,
          question: question ? question.q : ("Question " + (idx + 1)),
          options: question ? question.options : null,
          correctLetter: correctLetter, picks: q.picks || {},
          mwLetter: mwLetter, mwText: mwText, mwCount: mwCount
        };
      });

      // hardest first (unknown-key rows sink to the bottom)
      items.sort(function (a, b) {
        return (b.pctWrong == null ? -1 : b.pctWrong) - (a.pctWrong == null ? -1 : a.pctWrong);
      });

      items.forEach(function (it) {
        var pct = it.pctCorrect == null ? 0 : it.pctCorrect;
        // green = most got it right, red = most got it wrong
        var sev = it.pctCorrect == null ? "ok"
          : (pct >= 75 ? "ok" : (pct >= 50 ? "warm" : "hot"));
        html += '<div class="qrow">' +
          '<div class="qtop">' +
            '<span class="qn">Q' + (it.idx + 1) + '</span>' +
            '<span class="qtext">' + esc(it.question) + '</span>' +
          '</div>' +
          '<div class="barrow">' +
            '<div class="bar"><span class="' + sev + '" style="width:' + pct + '%"></span></div>' +
            '<div class="barpct ' + sev + '">' +
              (it.pctCorrect == null ? '—' : it.pctCorrect + '%') +
            '</div>' +
          '</div>' +
          (it.pctWrong == null
            ? '<div class="mw">' + it.n + ' responses (answer key not found for this question)</div>'
            : (it.pctWrong > 0
                ? '<div class="mw"><b>' + it.correctCount + '</b> correct of ' + it.n +
                  ' response' + (it.n === 1 ? '' : 's') + '</div>'
                : '<div class="mw good">All ' + it.n + ' correct ✓</div>')) +
          '<button type="button" class="view-choices" aria-expanded="false">View choices</button>' +
          choicesHtml(it) +
        '</div>';
      });

      html += '</div></div>';
    });

    // Refresh stays out in the open — it's the everyday "load new responses"
    // action. Lock / Reset live behind the Settings disclosure.
    html += '<div class="actions"><button class="btn btn-primary" id="refresh">Refresh</button></div>';

    html += '<div class="settings">' +
      '<button type="button" class="settings-toggle" id="settingsToggle" aria-expanded="false">' +
        '<span class="dash-chevron" aria-hidden="true"></span>⚙ Settings</button>' +
      '<div class="settings-body" id="settingsBody" hidden>' +
        '<div class="actions"><button class="btn btn-ghost" id="lock">Lock</button></div>' +
        '<div class="resetbox">' +
          '<button class="btn btn-danger" id="reset">Reset for next class</button>' +
          '<p class="resetnote">Archives every current response into dated tabs in the Sheet ' +
            '(nothing is deleted) and clears the dashboard so the next class starts fresh.</p>' +
          '<p class="savemsg" id="resetmsg"></p>' +
        '</div>' +
      '</div>' +
    '</div>';

    root.innerHTML = html;

    // Collapsible sections — click (or Enter/Space) on a section header to
    // fold its questions away, so you can focus on one section at a time.
    Array.prototype.forEach.call(root.querySelectorAll(".dash-head"), function (head) {
      function toggle() {
        var card = head.parentNode;
        var open = head.getAttribute("aria-expanded") !== "false";
        head.setAttribute("aria-expanded", open ? "false" : "true");
        card.classList.toggle("collapsed", open);
      }
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });

    // "View choices" — reveal the per-option breakdown for a single question.
    Array.prototype.forEach.call(root.querySelectorAll(".view-choices"), function (btn) {
      btn.addEventListener("click", function () {
        var panel = btn.nextElementSibling; // the .choices div
        if (!panel) return;
        var open = panel.hasAttribute("hidden");
        if (open) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Hide choices" : "View choices";
      });
    });

    // Sections are collapsed by default. When a brand-new section shows up,
    // auto-expand just that one so the latest results are on screen.
    if (freshTitles.length) {
      var cards = root.querySelectorAll(".card.dash");
      Array.prototype.forEach.call(cards, function (card, i) {
        if (freshTitles.indexOf(curTitles[i]) !== -1) {
          card.classList.remove("collapsed");
          var h = card.querySelector(".dash-head");
          if (h) h.setAttribute("aria-expanded", "true");
        }
      });
    }
    prevTitles = curTitles;

    document.getElementById("refresh").addEventListener("click", function () {
      var b = document.getElementById("refresh"); b.disabled = true; b.textContent = "Refreshing…";
      loadStats(key, function (err, d) {
        if (!err && d && !d.error) render(d, key);
        else { b.disabled = false; b.textContent = "Refresh"; }
      });
    });
    document.getElementById("lock").addEventListener("click", function () { renderGate(); });

    document.getElementById("settingsToggle").addEventListener("click", function () {
      var body = document.getElementById("settingsBody");
      var open = body.hasAttribute("hidden");
      if (open) body.removeAttribute("hidden"); else body.setAttribute("hidden", "");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.getElementById("reset").addEventListener("click", function () {
      if (!window.confirm("Archive all current responses and start fresh for the next class?\n\n" +
          "Nothing is deleted — the current results are moved into dated archive tabs in the Sheet.")) return;
      var b = this; b.disabled = true; b.textContent = "Archiving…";
      var m = document.getElementById("resetmsg"); m.className = "savemsg";
      archiveData(key, function (err, d) {
        if (err || !d || d.error) {
          b.disabled = false; b.textContent = "Reset for next class";
          m.className = "savemsg err"; m.textContent = "Couldn't archive — check your connection and try again.";
          return;
        }
        m.className = "savemsg ok";
        m.textContent = "Archived " + d.archived + " quiz tab" + (d.archived === 1 ? "" : "s") +
          ". Dashboard is now clear for the next class.";
        loadStats(key, function (e2, d2) { if (!e2 && d2 && !d2.error) render(d2, key); });
      });
    });
  }

  // ----------------------------------------------------------
  // Per-question breakdown: every option with how many of the current
  // session picked it, the correct answer flagged. Hidden until the
  // "View choices" button on that row is clicked.
  function choicesHtml(it) {
    var letters;
    if (it.options && it.options.length) {
      letters = it.options.map(function (_, i) { return String.fromCharCode(65 + i); });
    } else {
      letters = Object.keys(it.picks).sort();
    }
    var rows = letters.map(function (L) {
      var oi = L.charCodeAt(0) - 65;
      var text = (it.options && it.options[oi] != null) ? it.options[oi] : "";
      var count = it.picks[L] || 0;
      var pct = it.n ? Math.round(count / it.n * 100) : 0;
      var isCorrect = L === it.correctLetter;
      return '<div class="choice' + (isCorrect ? ' correct' : '') + '">' +
        '<span class="choice-fill" style="width:' + pct + '%"></span>' +
        '<span class="choice-letter">' + esc(L) + '</span>' +
        '<span class="choice-text">' +
          (text ? esc(text) : 'Option ' + esc(L)) +
          (isCorrect ? '<span class="choice-tag">✓ correct answer</span>' : '') +
        '</span>' +
        '<span class="choice-count"><b>' + count + '</b> of ' + it.n + '</span>' +
      '</div>';
    }).join("");
    return '<div class="choices" hidden>' + rows + '</div>';
  }

  // ----------------------------------------------------------
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
