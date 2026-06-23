// ============================================================
//  Advanced RPAS Course — instructor results dashboard
//  Reads ANONYMOUS aggregate tallies from the Apps Script
//  (JSONP) and turns them into "hardest questions first".
//  No names are ever transmitted or shown.
// ============================================================

(function () {
  "use strict";

  var root = document.getElementById("app");

  // title -> quiz definition (to map letters back to option text + answer key)
  var byTitle = {};
  Object.keys(QUIZZES).forEach(function (id) { byTitle[QUIZZES[id].title] = QUIZZES[id]; });

  if (!CONFIG.RESULTS_URL) {
    root.innerHTML = '<div class="topbar"><h1>Dashboard unavailable</h1></div>' +
      '<div class="error">No results endpoint configured.</div>';
    return;
  }

  renderGate();

  // ----------------------------------------------------------
  function renderGate(msg) {
    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">Instructor Dashboard</p>' +
        '<h1>' + esc(CONFIG.COURSE_NAME) + '</h1>' +
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
  function loadStats(key, done) {
    var cbName = "eeqd_" + Date.now();
    var s = document.createElement("script");
    var t = setTimeout(function () { cleanup(); done(new Error("timeout")); }, 15000);
    window[cbName] = function (data) { cleanup(); done(null, data); };
    s.onerror = function () { cleanup(); done(new Error("neterr")); };
    s.src = CONFIG.RESULTS_URL +
      "?stats=1&key=" + encodeURIComponent(key) +
      "&callback=" + cbName + "&_=" + Date.now();
    document.body.appendChild(s);
    function cleanup() {
      clearTimeout(t);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (s.parentNode) s.parentNode.removeChild(s);
    }
  }

  // ----------------------------------------------------------
  function render(data, key) {
    var quizzes = data.quizzes || [];

    var html =
      '<div class="topbar">' +
        '<p class="eyebrow">Instructor Dashboard</p>' +
        '<h1>' + esc(CONFIG.COURSE_NAME) + '</h1>' +
        '<p>Hardest questions first · aggregate only, no individual names.</p>' +
      '</div>';

    if (!quizzes.length) {
      html += '<div class="card"><p class="msg" style="text-align:center;margin:20px 0;">' +
        'No submissions yet. Once students start finishing quizzes, results show up here.</p></div>';
    }

    quizzes.forEach(function (qz) {
      var meta = byTitle[qz.title];
      html += '<div class="card dash">' +
        '<div class="dash-head"><h2>' + esc(qz.title) + '</h2>' +
        '<span class="resp">' + qz.responses + ' response' + (qz.responses === 1 ? '' : 's') + '</span></div>';

      var items = (qz.qs || []).map(function (q, idx) {
        var question = meta && meta.questions[idx];
        var hasKey = !!question;
        var correctLetter = hasKey ? String.fromCharCode(65 + question.answer) : null;
        var n = q.n || 0;
        var correctCount = correctLetter ? (q.picks[correctLetter] || 0) : 0;
        var pctWrong = (hasKey && n) ? Math.round((n - correctCount) / n * 100) : null;

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
          idx: idx, n: n, pctWrong: pctWrong, hasKey: hasKey,
          question: question ? question.q : ("Question " + (idx + 1)),
          mwLetter: mwLetter, mwText: mwText, mwCount: mwCount
        };
      });

      // hardest first (unknown-key rows sink to the bottom)
      items.sort(function (a, b) {
        return (b.pctWrong == null ? -1 : b.pctWrong) - (a.pctWrong == null ? -1 : a.pctWrong);
      });

      items.forEach(function (it) {
        var pct = it.pctWrong == null ? 0 : it.pctWrong;
        var sev = pct >= 50 ? "hot" : (pct >= 25 ? "warm" : "ok");
        html += '<div class="qrow">' +
          '<div class="qtop">' +
            '<span class="qn">Q' + (it.idx + 1) + '</span>' +
            '<span class="qpct ' + sev + '">' +
              (it.pctWrong == null ? '—' : it.pctWrong + '% wrong') +
            '</span>' +
          '</div>' +
          '<div class="qtext">' + esc(it.question) + '</div>' +
          '<div class="bar"><span class="' + sev + '" style="width:' + pct + '%"></span></div>' +
          (it.pctWrong == null
            ? '<div class="mw">' + it.n + ' responses (answer key not found for this question)</div>'
            : (it.mwLetter && it.pctWrong > 0
                ? '<div class="mw">Most-picked wrong: <b>' + esc(it.mwLetter) +
                  (it.mwText ? '. ' + esc(it.mwText) : '') + '</b> &middot; ' + it.mwCount +
                  ' of ' + it.n + '</div>'
                : '<div class="mw good">Everyone got this one right ✓</div>')) +
        '</div>';
      });

      html += '</div>';
    });

    html += '<div class="actions"><button class="btn btn-ghost" id="refresh">Refresh</button>' +
            '<button class="btn btn-primary" id="lock">Lock</button></div>';

    root.innerHTML = html;

    document.getElementById("refresh").addEventListener("click", function () {
      var b = document.getElementById("refresh"); b.disabled = true; b.textContent = "Refreshing…";
      loadStats(key, function (err, d) {
        if (!err && d && !d.error) render(d, key);
        else { b.disabled = false; b.textContent = "Refresh"; }
      });
    });
    document.getElementById("lock").addEventListener("click", function () { renderGate(); });
  }

  // ----------------------------------------------------------
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
