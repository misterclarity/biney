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
    $("#cL").textContent = car + " Hz";
    $("#cR").textContent = (car + beat).toFixed(1) + " Hz";
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
      });
    });
    syncBuilder();
    $("#beatsFav").innerHTML = favBtn("x:beats", "Beat builder");
  }
