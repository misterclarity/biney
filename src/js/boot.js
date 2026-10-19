  /* --------------------------------- start ---------------------------------
     Every other file only declares. This wires the page up, in order: where two handlers listen
     for the same key on the whole document, the one wired first runs first.
  ---------------------------------------------------------------------------- */

  playerInit();
  trackListInit();
  builderInit();
  primeInit();
  dialogsInit();
  render("all");
  initBreath();
  hrInit();
  shellInit();
  window.addEventListener("pagehide", function () {
    if (A.playing) hardStop(true);
    if (B.state === "running") bPause();
  });
