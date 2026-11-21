  /* --------------------------------- start ---------------------------------
     Every other file only declares. This wires the page up, in order: where two handlers listen
     for the same key on the whole document, the one wired first runs first.
  ---------------------------------------------------------------------------- */

  /* Each part starts on its own. If one can't (a stored value it can't read, a browser that lacks
     something it needs), the rest of the app still works; what failed is said once, shown on the
     console and kept for the feedback form. */
  var BOOT_FAILED = [];
  function start(name, fn) {
    try { fn(); } catch (e) {
      BOOT_FAILED.push(name + ": " + String(e && e.message || e).slice(0, 120));
      if (window.console && console.error) console.error("Entrain: " + name + " didn't start", e);
    }
  }
  [["the new techniques", supInit],                         // first: whether this device is unlocked decides how Breathe opens
    ["the player", playerInit], ["the lock screen", msInit], ["the beat builder", builderInit], ["the custom primer", primeInit], ["dialogs", dialogsInit],
    ["the safety note", safeInit], ["Breathe", initBreath], ["Heart", hrInit], ["the menus", shellInit], ["updates", appInit], ["background sounds", ambInit],
    ["quotes", qInit], ["Today", todayInit], ["History", hInit], ["favourites", favInit], ["track pages", trInit], ["practices", pInit], ["the library", libInit],
    ["yoga", yInit], ["the NVC practices", nvcInit], ["Healthy living", lvInit], ["Learn", lnInit], ["search", fdInit], ["backups", bkInit],
    ["the first page", route]                              // the library is built when it's first shown, not here
  ].forEach(function (x) { start(x[0], x[1]); });
  start("the library's lengths", libWarm);                 // its practices' lengths are worked out once the phone is idle
  if (BOOT_FAILED.length) setTimeout(function () {
    try { toast("Part of Entrain didn't start: " + BOOT_FAILED.map(function (f) { return f.split(":")[0]; }).join(", ") + ". The rest works; Settings has a feedback form to report it."); } catch (e) {}
  }, 800);
  window.addEventListener("pagehide", function () {
    if (A.playing) hardStop(true);
    else hTrack();                       // a paused track counts too
    if (B.state === "running") bPause();
  });
