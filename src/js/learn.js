  /* ---------------------------------- Learn ----------------------------------
     Learn is written out in learn.html: brain-wave states, the techniques at a glance by sense, the research behind
     each part of Entrain, and what it leaves out. Reading it is always free. A link in it that leads to one of the
     new techniques (a practice, a breathing pattern or a track flagged sup: true, or Sleep sounds) carries the donation cup while this
     device is locked, and loses it as soon as it's unlocked (supRefresh calls lnMark).
  ------------------------------------------------------------------------------ */

  // the practice, breathing pattern or track a link leads to, if it leads to one
  function lnItem(href) {
    if (href === "#sleep-sounds") return TOOLS.sleep;          // a tool of its own (sleepsounds.js)
    var m = /^#(practice|breathe|track)\/([\w-]+)$/.exec(href || ""), list;
    if (!m) return null;
    list = m[1] === "practice" ? PRACTICES : m[1] === "breathe" ? BREATHS : TRACKS;
    for (var i = 0; i < list.length; i++) if (list[i].id === m[2]) return list[i];
    return null;
  }
  // the cup beside each link to a locked new technique, and none beside the rest
  function lnMark() {
    var sci = $("#science");
    if (!sci) return;
    sci.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var tag = a.nextElementSibling, has = !!tag && tag.classList.contains("sup-tag");
      if (supLocked(lnItem(a.getAttribute("href")))) { if (!has) a.insertAdjacentHTML("afterend", supTag(true)); }
      else if (has) tag.parentNode.removeChild(tag);
    });
  }
  function lnInit() {
    lnMark();
  }
