  /* --------------------------- prime mode ---------------------------
     Exposure before a task beat exposure during it, so this makes that
     protocol the featured path rather than a track you have to know to pick.
  -------------------------------------------------------------------- */

  var THEN_COPY = {
    "continue": "then a cue to begin and the beats carry on at about half volume while you work.",
    "noise": "then a cue to begin, the beats fade out and the pink noise bed carries on alone.",
    "silence": "then a cue to begin and the audio stops \u2014 priming alone was enough in the trials."
  };

  function primeCfg() {
    var bv = document.querySelector('input[name="pbeat"]:checked').value.split("|");
    return {
      beat: parseFloat(bv[0]),
      carrier: parseInt(bv[1], 10),
      minutes: parseInt(document.querySelector('input[name="pmin"]:checked').value, 10),
      then: document.querySelector('input[name="pthen"]:checked').value
    };
  }

  function syncPrime() {
    var c = primeCfg();
    $("#primeStart").innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-play"/></svg>Start ' + c.minutes + "-minute prime";
    $("#primeHint").textContent = c.minutes + " min of " + c.beat + " Hz " +
      bandFor(c.beat).name.toLowerCase() + " on a " + c.carrier + " Hz carrier, " + THEN_COPY[c.then];
  }

  function primeInit() {
    ["#pfChips", "#plChips", "#ptChips"].forEach(function (sel) {
      var box = $(sel);
      box.addEventListener("change", function () {
        var chips = box.querySelectorAll(".chip");
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.toggle("on", chips[i].querySelector("input").checked);
        }
        syncPrime();
      });
    });

    $("#primeStart").addEventListener("click", function () {
      var c = primeCfg();
      var b = bandFor(c.beat);
      gate(function () {
        load({
          id: "prime", cat: c.beat <= 12 ? "relax" : "stim", band: b.name,
          name: "Prime \u2014 " + c.beat + " Hz " + b.name,
          carrier: c.carrier, beat: c.beat, minutes: c.minutes, strength: 0,
          desc: "", ev: "", cite: "",
          then: { mode: c.then }
        });
      });
    });
    syncPrime();
    $("#primeFav").innerHTML = favBtn("x:prime", "Custom primer");
  }
