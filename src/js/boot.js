  /* --------------------------------- start ---------------------------------
     Every other file only declares. This wires the page up, in order: where two handlers listen
     for the same key on the whole document, the one wired first runs first.
  ---------------------------------------------------------------------------- */

  playerInit();
  builderInit();
  primeInit();
  dialogsInit();
  initBreath();
  hrInit();
  shellInit();
  appInit();
  ambInit();
  qInit();
  todayInit();
  hInit();
  favInit();
  trInit();
  pInit();
  libInit();
  yInit();
  nvcInit();
  fdInit();
  pRenderLib();
  route();
  window.addEventListener("pagehide", function () {
    if (A.playing) hardStop(true);
    else hTrack();                       // a paused track counts too
    if (B.state === "running") bPause();
  });
