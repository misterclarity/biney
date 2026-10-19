  /* --------------------------------- core ---------------------------------
     Small helpers every other file uses. Everything is one script in one scope, so a name
     declared here is visible everywhere; the build stops if any file declares it again.
  -------------------------------------------------------------------------- */

  var $ = function (sel) { return document.querySelector(sel); };

  // settings and history live in localStorage, under "entrain."; a browser that refuses storage just forgets
  var store = {
    get: function (k) { try { return localStorage.getItem("entrain." + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("entrain." + k, v); } catch (e) {} }
  };
  function storeDel(k) { try { localStorage.removeItem("entrain." + k); } catch (e) {} }

  var RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // the session clock, in seconds
  function bNow() { return (window.performance && performance.now ? performance.now() : Date.now()) / 1000; }
  // seconds as mm:ss
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // set an element's text only when it changes
  function bSetT(sel, v) { var el = $(sel); if (el && el.textContent !== v) el.textContent = v; }
  // evidence strength, one to three dots
  function dots(n) {
    var h = '<span class="strength" title="Strength of supporting evidence: ' + n + ' of 3" aria-label="Evidence strength ' + n + ' of 3">';
    for (var i = 1; i <= 3; i++) h += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    return h + "</span>";
  }

