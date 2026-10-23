  /* ------------------------------ one safety note ------------------------------
     The whole note lives in Learn, under Safety, and opens over any page from a "safety notes"
     link, so it's never more than a tap away and never written out twice. Each page shows only
     the line that matters there: the beats on a track, the primer, the builder and any practice
     that plays one; the breath on Breathe; a practice's own cautions in its introduction.
  -------------------------------------------------------------------------------- */

  var SAFE_BEATS = "Ask your doctor first if you have epilepsy or another seizure disorder, keep headphones at least 15 cm (6 in) from a pacemaker or implanted defibrillator, and never listen while driving.";

  function safeLink(txt) { return '<button type="button" class="sf-link" data-safety="1">' + esc(txt || "Safety notes") + "</button>"; }
  // a caution box: its lines in order, then the link to the whole note
  function safeBox(lines) {
    return '<div class="si-caution"><svg class="i" aria-hidden="true"><use href="#i-warn"/></svg><span>' +
      lines.filter(Boolean).map(esc).join(" ") + " " + safeLink() + "</span></div>";
  }
  function safeOpen() {
    var body = $("#sfBody");
    body.innerHTML = $("#sfNote").innerHTML;
    body.querySelectorAll("[id]").forEach(function (el) { el.removeAttribute("id"); });   // search gives Learn's paragraphs ids to land on
    openDialog("#sfModal");
    $("#sfModal .modal-card").scrollTop = 0;
    setTimeout(function () { try { $("#sfClose").focus({ preventScroll: true }); } catch (e) { $("#sfClose").focus(); } }, 30);   // the note reads from the top
  }
  function safeClose() { if (!$("#sfModal").hidden) closeDialog("#sfModal"); }
  function safeInit() {
    document.querySelectorAll("[data-safe=beats]").forEach(function (el) { el.outerHTML = safeBox([SAFE_BEATS]); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-safety]");
      if (!b) return;
      e.preventDefault();
      safeOpen();
    });
    $("#sfClose").addEventListener("click", safeClose);
    $("#sfModal").addEventListener("click", function (e) { if (e.target === this) safeClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") safeClose(); });
  }
