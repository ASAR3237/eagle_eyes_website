// ============================================================
//  Eagle Eyes Advanced RPAS Course — quiz engine
//  (no backend, fully client-side)
//
//  index.html IS this engine:
//    /advanced-quiz/            -> menu of all quizzes
//    /advanced-quiz/?q=airlaw   -> runs that quiz
//
//  Optional results collection: if CONFIG.RESULTS_URL is set
//  (a Google Apps Script web-app URL), the results screen shows
//  a "Save your results" box that posts the submission to your
//  Google Sheet. Leave it blank to keep everything anonymous.
// ============================================================

(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const quizId = params.get("q");
  const root = document.getElementById("app");

  const all = (typeof QUIZZES !== "undefined") ? QUIZZES : {};
  const quiz = quizId ? all[quizId] : null;

  // Remember the student's name + email across quizzes (one device = one
  // student), so they only type it once. Used to prefill the Submit box and
  // sent with each result so the instructor can email a certificate.
  const STUDENT_KEY = "ee_student_v1";
  function loadStudent() {
    try { return JSON.parse(localStorage.getItem(STUDENT_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveStudent(name, email) {
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify({ name: name, email: email })); }
    catch (e) { /* private mode / storage full — non-fatal */ }
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
  function hasStudent() {
    var s = loadStudent();
    return !!(s && s.name && validEmail(s.email || ""));
  }
  function forgetStudent() {
    try { localStorage.removeItem(STUDENT_KEY); } catch (e) { /* non-fatal */ }
  }

  if (!quizId) { renderMenu(); return; }

  if (!quiz) {
    root.innerHTML =
      '<div class="topbar"><p class="eyebrow">' + escapeHtml(CONFIG.COURSE_NAME) + '</p>' +
      '<h1>Quiz not found</h1></div>' +
      '<div class="error">No quiz matches "<b>' + escapeHtml(quizId) +
      '</b>".<br><br><a href="./">See all quizzes</a></div>';
    return;
  }

  let current = 0;
  let score = 0;
  let answered = false;
  let responses = [];        // indexed by ORIGINAL question position (canonical order)
  const total = quiz.questions.length;
  // Display order is shuffled each attempt (anti-copying in a room of phones),
  // but results are recorded in the original order so the Sheet columns and
  // dashboard stay aligned across students.
  let order = shuffle(quiz.questions.map(function (_, i) { return i; }));

  start();

  // ----------------------------------------------------------
  // If results are being collected and this phone doesn't know the student
  // yet, ask for name + email ONCE up front. After that (stored locally),
  // every quiz scanned on this phone skips straight to the questions.
  function start() {
    if (CONFIG.RESULTS_URL && !hasStudent()) { renderStartGate(); }
    else { render(); }
  }

  // ----------------------------------------------------------
  function renderStartGate() {
    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">' + escapeHtml(quiz.title) + '</p>' +
        '<h1>' + escapeHtml(CONFIG.COURSE_NAME) + '</h1>' +
      '</div>' +
      '<div class="card">' +
        '<p class="question">Before you start</p>' +
        '<p class="msg" style="margin:-8px 0 16px;">Enter your name and email so your ' +
          'instructor can send your certificate. You only need to do this once on this phone.</p>' +
        '<div class="save" style="border:none;background:none;padding:0;margin:0;">' +
          '<input id="nm" type="text" maxlength="60" placeholder="Your full name" ' +
            'autocomplete="name">' +
          '<input id="em" type="email" maxlength="80" placeholder="Your email (for your certificate)" ' +
            'autocomplete="email" inputmode="email">' +
          '<button class="btn btn-primary" id="startbtn">Start quiz &rarr;</button>' +
          '<p class="savemsg err" id="startmsg"></p>' +
        '</div>' +
      '</div>';

    var nm = document.getElementById("nm");
    document.getElementById("startbtn").addEventListener("click", function () {
      var name = (nm.value || "").trim();
      var email = (document.getElementById("em").value || "").trim();
      var msg = document.getElementById("startmsg");
      if (!name) { msg.textContent = "Please enter your full name."; nm.focus(); return; }
      if (!validEmail(email)) {
        msg.textContent = "Please enter a valid email so we can send your certificate.";
        document.getElementById("em").focus();
        return;
      }
      saveStudent(name, email);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    nm.focus();
  }

  // ----------------------------------------------------------
  function renderMenu() {
    const items = Object.keys(all).map(function (id) {
      const qz = all[id];
      return (
        '<a class="quizlink" href="?q=' + encodeURIComponent(id) + '">' +
          '<h3>' + escapeHtml(qz.title) + '</h3>' +
          '<p>' + escapeHtml(qz.description || "") + '</p>' +
          '<div class="meta">' + qz.questions.length + ' questions &rarr;</div>' +
        '</a>'
      );
    }).join("");

    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">Interactive Practice</p>' +
        '<h1>' + escapeHtml(CONFIG.COURSE_NAME) + '</h1>' +
        '<p>Pick a topic to test yourself. Each quiz grades itself instantly.</p>' +
      '</div>' +
      '<div class="quizlist">' + items + '</div>' +
      '<p class="footnote">Scan a QR code on the course slides to jump straight to a quiz.</p>';
  }

  // ----------------------------------------------------------
  function render() {
    const q = quiz.questions[order[current]];

    const optsHtml = q.options.map(function (text, i) {
      const letter = String.fromCharCode(65 + i);
      return (
        '<button class="opt" data-i="' + i + '">' +
          '<span class="marker">' + letter + '</span>' +
          '<span class="label">' + escapeHtml(text) + '</span>' +
        '</button>'
      );
    }).join("");

    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">' + escapeHtml(quiz.title) + '</p>' +
        '<h1>' + escapeHtml(CONFIG.COURSE_NAME) + '</h1>' +
      '</div>' +
      '<div class="progress"><span style="width:' +
        ((current) / total * 100) + '%"></span></div>' +
      '<p class="qcount">Question ' + (current + 1) + ' of ' + total + '</p>' +
      '<div class="card">' +
        '<p class="question">' + escapeHtml(q.q) + '</p>' +
        '<div class="options">' + optsHtml + '</div>' +
        '<div class="explain" id="explain"></div>' +
        '<div class="actions">' +
          '<button class="btn btn-primary" id="next" disabled>' +
            (current === total - 1 ? "See results" : "Next question") +
          '</button>' +
        '</div>' +
      '</div>';

    answered = false;
    root.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", onAnswer);
    });
    document.getElementById("next").addEventListener("click", onNext);
  }

  // ----------------------------------------------------------
  function onAnswer(e) {
    if (answered) return;
    answered = true;

    const origIndex = order[current];
    const q = quiz.questions[origIndex];
    const chosen = parseInt(e.currentTarget.getAttribute("data-i"), 10);
    const correct = q.answer;
    const isRight = chosen === correct;
    if (isRight) score++;

    responses[origIndex] = {
      n: origIndex + 1,
      q: q.q,
      chosen: String.fromCharCode(65 + chosen),
      chosenText: q.options[chosen],
      correct: String.fromCharCode(65 + correct),
      right: isRight
    };

    root.querySelectorAll(".opt").forEach(function (btn) {
      const i = parseInt(btn.getAttribute("data-i"), 10);
      btn.classList.add("locked");
      if (i === correct) {
        btn.classList.add("correct");
        btn.querySelector(".marker").textContent = "✓";
      } else if (i === chosen) {
        btn.classList.add("wrong");
        btn.querySelector(".marker").textContent = "✗";
      } else {
        btn.classList.add("dim");
      }
    });

    const ex = document.getElementById("explain");
    ex.className = "explain show " + (isRight ? "good" : "bad");
    ex.innerHTML =
      "<b>" + (isRight ? "Correct ✓" : "Not quite ✗") + "</b>" +
      (q.explanation ? escapeHtml(q.explanation) : "");

    document.getElementById("next").disabled = false;
  }

  // ----------------------------------------------------------
  function onNext() {
    if (current < total - 1) {
      current++;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showResults();
    }
  }

  // ----------------------------------------------------------
  function showResults() {
    const pct = Math.round(score / total * 100);
    let msg;
    if (pct === 100)      msg = "Perfect score — you nailed it!";
    else if (pct >= 75)   msg = "Solid work. Review the ones you missed.";
    else if (pct >= 50)   msg = "Getting there — worth another look at this topic.";
    else                  msg = "Keep studying this one and try again.";

    const stored = loadStudent();
    const known = !!(CONFIG.RESULTS_URL && hasStudent());

    var saveBox = '';
    if (known) {
      // We already know who this is — send automatically, no second prompt.
      saveBox =
        '<div class="save" id="save">' +
          '<p class="sentas">Submitting your results as <b>' + escapeHtml(stored.name) + '</b></p>' +
          '<p class="savemsg" id="savemsg">Sending…</p>' +
          '<p class="notme"><a href="#" id="notme">Not you?</a></p>' +
        '</div>';
    } else if (CONFIG.RESULTS_URL) {
      // Fallback (e.g. storage blocked) — ask here as before.
      saveBox =
        '<div class="save" id="save">' +
          '<label for="nm">Send your results to your instructor</label>' +
          '<input id="nm" type="text" maxlength="60" ' +
            'placeholder="Your full name" autocomplete="name" ' +
            'value="' + escapeHtml(stored.name || "") + '">' +
          '<input id="em" type="email" maxlength="80" ' +
            'placeholder="Your email (for your certificate)" autocomplete="email" ' +
            'inputmode="email" value="' + escapeHtml(stored.email || "") + '">' +
          '<button class="btn btn-primary" id="savebtn">Submit</button>' +
          '<p class="savemsg" id="savemsg"></p>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="topbar">' +
        '<p class="eyebrow">' + escapeHtml(quiz.title) + '</p>' +
        '<h1>Your results</h1>' +
      '</div>' +
      '<div class="card result">' +
        '<div class="scorering" style="--pct:' + pct + '%">' +
          '<div class="inner">' +
            '<span class="big">' + score + '/' + total + '</span>' +
            '<span class="small">' + pct + '%</span>' +
          '</div>' +
        '</div>' +
        '<h2>' + pct + '% correct</h2>' +
        '<p class="msg">' + msg + '</p>' +
        saveBox +
        '<div class="actions">' +
          '<button class="btn btn-ghost" id="retry">Try again</button>' +
          '<a class="btn btn-primary" href="./" ' +
            'style="display:grid;place-items:center;text-decoration:none;">More quizzes</a>' +
        '</div>' +
      '</div>';

    document.getElementById("retry").addEventListener("click", function () {
      current = 0; score = 0; responses = [];
      order = shuffle(quiz.questions.map(function (_, i) { return i; }));
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (known) {
      document.getElementById("notme").addEventListener("click", function (e) {
        e.preventDefault();
        forgetStudent();
        location.reload();   // re-runs the up-front name/email gate
      });
      submitAuto(pct);       // fire-and-update: send right away
    } else if (CONFIG.RESULTS_URL) {
      document.getElementById("savebtn")
        .addEventListener("click", function () { submitResults(pct); });
    }
  }

  // ----------------------------------------------------------
  // Auto-send for a known student (identity already captured up front).
  function submitAuto(pct) {
    const out = document.getElementById("savemsg");
    const stored = loadStudent();
    const payload = {
      quiz: quizId,
      title: quiz.title,
      name: stored.name,
      email: stored.email,
      score: score,
      total: total,
      pct: pct,
      answers: responses
    };
    out.className = "savemsg";
    out.textContent = "Sending…";
    fetch(CONFIG.RESULTS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      out.className = "savemsg ok";
      out.textContent = "Results sent ✓ Thanks, " + stored.name + "!";
    }).catch(function () {
      out.className = "savemsg err";
      out.innerHTML = "Couldn't send — check your connection. " +
        '<a href="#" id="retrysend">Try again</a>';
      var rs = document.getElementById("retrysend");
      if (rs) rs.addEventListener("click", function (e) { e.preventDefault(); submitAuto(pct); });
    });
  }

  // ----------------------------------------------------------
  function submitResults(pct) {
    const input = document.getElementById("nm");
    const emailInput = document.getElementById("em");
    const btn = document.getElementById("savebtn");
    const out = document.getElementById("savemsg");
    const name = (input.value || "").trim();
    const email = (emailInput.value || "").trim();

    if (!name) {
      out.className = "savemsg err";
      out.textContent = "Please enter your full name first.";
      input.focus();
      return;
    }
    if (!validEmail(email)) {
      out.className = "savemsg err";
      out.textContent = "Please enter a valid email so we can send your certificate.";
      emailInput.focus();
      return;
    }

    saveStudent(name, email);

    btn.disabled = true;
    input.disabled = true;
    emailInput.disabled = true;
    out.className = "savemsg";
    out.textContent = "Sending…";

    const payload = {
      quiz: quizId,
      title: quiz.title,
      name: name,
      email: email,
      score: score,
      total: total,
      pct: pct,
      answers: responses
    };

    fetch(CONFIG.RESULTS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      out.className = "savemsg ok";
      out.textContent = "Saved ✓ Thanks, " + name + "!";
    }).catch(function () {
      out.className = "savemsg err";
      out.textContent = "Couldn't send — check your connection and try again.";
      btn.disabled = false;
      input.disabled = false;
      emailInput.disabled = false;
    });
  }

  // ----------------------------------------------------------
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ----------------------------------------------------------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
