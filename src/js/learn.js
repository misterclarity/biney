  /* ---------------------------------- Learn ----------------------------------
     Learn is written out in learn.html: brain-wave states, the techniques at a glance by sense, the research behind
     each part of Entrain, and what it leaves out. Reading it is always free. A link in it that leads to one of the
     new techniques (a practice, a breathing pattern or a track flagged sup: true, Sleep sounds, or a part of Settings,
     Heart or History that opens only with a donation) carries the donation cup while this device is locked, and loses
     it as soon as it's unlocked (supRefresh calls lnMark). Air and scent and Background sound in Settings have free
     parts too, so a link to them carries the cup only when it has data-sup, which goes on one whose words name the
     part that needs the donation (Air the room, background music).
  ------------------------------------------------------------------------------ */

  // where a link lands on something that opens only with a donation, as a whole: Settings' screen light,
  // scenes, your own music, check-ins and daily rhythm; Heart's camera, room air and brain trends (blood oxygen
  // is free); History's resonance course and personal experiment
  var LN_SUP = ["#st-light", "#st-scenes", "#st-mymusic", "#st-checkin", "#st-rhythm", "#cam", "#air", "#eeg", "#rcourse", "#experiment"];
  var LN_LOCKED = { sup: true };
  // the practice, breathing pattern or track a link leads to, if it leads to one, or LN_LOCKED for one of those
  function lnItem(href) {
    if (href === "#sleep-sounds") return TOOLS.sleep;          // a tool of its own (sleepsounds.js)
    if (LN_SUP.indexOf(href) >= 0) return LN_LOCKED;
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
      if (supLocked(a.hasAttribute("data-sup") ? LN_LOCKED : lnItem(a.getAttribute("href")))) { if (!has) a.insertAdjacentHTML("afterend", supTag(true)); }
      else if (has) tag.parentNode.removeChild(tag);
    });
  }
  function lnInit() {
    lnMark();
  }
