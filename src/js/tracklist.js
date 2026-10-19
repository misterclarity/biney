  /* ------------------------------ the track list ------------------------------
     The Sounds view's cards, filtered by goal, each with its own play button.
  ------------------------------------------------------------------------------ */

  var curFilter = "all";
  function render(filter) {
    curFilter = filter;
    var list = TRACKS.filter(function (t) { return filter === "all" || t.goal === filter; });
    var html = list.map(function (t) {
      var beatTxt = typeof t.rampFrom === "number"
        ? t.rampFrom + "→" + t.beat + " Hz"
        : t.beat + " Hz";
      return '' +
        '<li class="card" data-cat="' + t.cat + '" data-id="' + t.id + '" data-min="' + t.minutes + '">' +
          '<div class="card-top">' +
            '<h3>' + esc(t.name) + '</h3>' +
            '<span class="band">' + esc(t.band) + '</span>' +
          '</div>' +
          '<p class="desc">' + esc(t.desc) + '</p>' +
          '<div class="specs">' +
            '<span class="spec">Beat <b>' + beatTxt + '</b></span>' +
            '<span class="spec">Carrier <b>' + t.carrier + ' Hz</b></span>' +
            '<span class="spec">Length <b>' + t.minutes + ' min</b></span>' +
            (t.notch
              ? '<button class="spec notch-chip" data-rematch="1">Notch <b>' +
                  (tinnitusHz() ? Math.round(tinnitusHz()) + ' Hz' : 'set your pitch') + '</b></button>'
              : '') +
          '</div>' +
          '<button class="play-btn">▶&nbsp; Play ' + t.minutes + ' min</button>' +
          '<details class="ev"><summary>Evidence ' + dots(t.strength) + '</summary>' +
            '<div class="ev-body">' + esc(t.ev) + '<cite>' + esc(t.cite) + '</cite></div>' +
          '</details>' +
        '</li>';
    }).join("");

    $("#grid").innerHTML = html;
    $("#count").textContent = list.length + " track" + (list.length === 1 ? "" : "s");
    markCard();
  }

  function trackListInit() {
    $("#grid").addEventListener("click", function (e) {
      if (e.target.closest("[data-rematch]")) { pendingPitch = null; openMatcher(); return; }
      var btn = e.target.closest(".play-btn");
      if (!btn) return;
      var id = btn.closest(".card").dataset.id;
      if (A.track && A.track.id === id && A.playing) { pause(); return; }
      if (A.track && A.track.id === id && !A.playing && A.elapsed > 0) { play(); return; }
      var track = TRACKS.filter(function (t) { return t.id === id; })[0];
      if (!track) return;
      gate(function () {
        if (track.notch && !tinnitusHz()) {      // the notch is useless until it is aimed
          pendingPitch = function () { load(track); };
          openMatcher();
          return;
        }
        load(track);
      });
    });

    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function (e) {
        for (var j = 0; j < tabs.length; j++) tabs[j].setAttribute("aria-pressed", "false");
        e.currentTarget.setAttribute("aria-pressed", "true");
        render(e.currentTarget.dataset.filter);
      });
    }
  }
