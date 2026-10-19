  /* ------------------------------- favourites -------------------------------
     A star on a practice, a track, the primer, the beat builder or a breathing pattern keeps it
     on Today. Stored on the device as library keys: a practice's id, b: a breathing pattern,
     t: a track, x: a tool, in the order you starred them.
  ---------------------------------------------------------------------------- */

  var FAV = null;
  function favList() {
    if (FAV) return FAV;
    try { FAV = JSON.parse(store.get("favs") || "[]"); } catch (e) {}
    if (!Array.isArray(FAV)) FAV = [];
    FAV = FAV.filter(function (k) { return typeof k === "string" && k; });
    return FAV;
  }
  function favHas(key) { return favList().indexOf(key) >= 0; }
  function favSet(key, on) {
    var l = favList(), i = l.indexOf(key);
    if (on && i < 0) l.push(key);
    if (!on && i >= 0) l.splice(i, 1);
    store.set("favs", JSON.stringify(l));
    favSync();
  }
  // a star button for one item; the same key can show on several screens at once
  function favBtn(key, name, cls) {
    var on = favHas(key);
    return '<button class="fav' + (cls ? " " + cls : "") + '" data-fav="' + esc(key) + '" data-name="' + esc(name) + '" aria-pressed="' + on + '"' +
      ' aria-label="Favourite: ' + esc(name) + '" title="' + (on ? "In your favourites on Today" : "Add to your favourites on Today") + '">' +
      '<svg class="i" aria-hidden="true"><use href="#i-star"/></svg><span class="fav-t">Favourite</span></button>';
  }
  // the star on Breathe follows the pattern on screen; your own timings have no page to come back to
  function bFavSync() {
    var el = $("#bFav");
    if (!el) return;
    var p = preset(BC.pattern);
    el.innerHTML = p && p.goal ? favBtn("b:" + p.id, PATTERN_NAMES[p.id] || p.id, "b-fav") : "";
  }
  function favSync() {
    document.querySelectorAll("[data-fav]").forEach(function (b) {
      var on = favHas(b.dataset.fav);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.title = on ? "In your favourites on Today" : "Add to your favourites on Today";
    });
  }
  function favInit() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fav]");
      if (!b || !b.dataset.fav) return;
      e.preventDefault();
      var on = !favHas(b.dataset.fav);
      favSet(b.dataset.fav, on);
      toast(on ? (b.dataset.name || "It") + " is in your favourites on Today." : "Taken out of your favourites.", { ms: 3500 });
    });
  }
