  /* ------------------------------ builder ---------------------------- */

  function syncBuilder() {
    var beat = parseFloat($("#cBeat").value);
    var car = parseInt($("#cCar").value, 10);
    var min = parseInt($("#cMin").value, 10);
    var b = bandFor(beat);
    $("#cBeatV").textContent = beat.toFixed(1) + " Hz";
    $("#cCarV").textContent = car + " Hz";
    $("#cMinV").textContent = min + " min";
    $("#cBand").textContent = b.name + " — " + b.note;
    // what each ear hears, the way the beat plays (beatmode.js)
    var m = bmMode(), ears = m === "monaural" ? 'Both ears <b id="cL"></b> and <b id="cR"></b>'
      : m === "isochronic" ? 'Both ears <b id="cL"></b>, on and off <b id="cR"></b> times a second'
      : 'Left ear <b id="cL"></b> · Right ear <b id="cR"></b>';
    if ($("#cEars").dataset.m !== m) { $("#cEars").dataset.m = m; $("#cEars").innerHTML = ears; }
    $("#cL").textContent = car + " Hz";
    $("#cR").textContent = m === "isochronic" ? beat.toFixed(1) : (car + beat).toFixed(1) + " Hz";
    $("#cPlay").innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-play"/></svg>Play ' + min + " min";
  }

  function builderInit() {
    ["#cBeat", "#cCar", "#cMin"].forEach(function (sel) {
      $(sel).addEventListener("input", syncBuilder);
    });

    $("#cPlay").addEventListener("click", function () {
      var beat = parseFloat($("#cBeat").value);
      var car = parseInt($("#cCar").value, 10);
      var min = parseInt($("#cMin").value, 10);
      var b = bandFor(beat);
      gate(function () {
        load({
          id: "custom", cat: beat <= 12 ? "relax" : "stim", band: b.name,
          name: "Custom " + beat.toFixed(1) + " Hz " + b.name,
          carrier: car, beat: beat, minutes: min, strength: 0,
          desc: "", ev: "", cite: ""
        });
      }, bmMode());                            // on speakers (monaural, isochronic) there's no headphone check
    });
    syncBuilder();
    $("#beatsFav").innerHTML = favBtn("x:beats", "Beat builder");
  }
