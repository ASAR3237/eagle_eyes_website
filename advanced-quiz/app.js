// ============================================================
//  Eagle Eyes Advanced RPAS Course — quiz engine
//  (no backend, fully client-side)
//
//  index.html IS this engine:
//    /advanced-quiz/            -> menu of all quizzes
//    /advanced-quiz/?q=airlaw   -> runs that quiz
// ============================================================

(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const quizId = params.get("q");
  const root = document.getElementById("app");

  const all = (typeof QUIZZES !== "undefined") ? QUIZZES : {};
  const quiz = quizId ? all[quizId] : null;

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
  const total = quiz.questions.length;

  render();

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
    const q = quiz.questions[current];

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

    const q = quiz.questions[current];
    const chosen = parseInt(e.currentTarget.getAttribute("data-i"), 10);
    const correct = q.answer;
    const isRight = chosen === correct;
    if (isRight) score++;

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
        '<div class="actions">' +
          '<button class="btn btn-ghost" id="retry">Try again</button>' +
          '<a class="btn btn-primary" href="./" ' +
            'style="display:grid;place-items:center;text-decoration:none;">More quizzes</a>' +
        '</div>' +
      '</div>';

    document.getElementById("retry").addEventListener("click", function () {
      current = 0; score = 0; render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ----------------------------------------------------------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
