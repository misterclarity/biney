/* Entrain offline helper.
   Keeps a copy of the app on the device so it opens without a connection. The page itself
   (index.html) is still a complete, self-contained file; this worker only stores it, the app
   description and the icons. Nothing else is fetched, recorded or sent.

   Version 343bf3f6ea is a hash of every stored file, so each new deploy changes this script.
   The browser notices that, installs the new copy in the background, and the page offers an
   "Update" button; the old copy keeps serving until then. */
"use strict";

var CACHE = "entrain-343bf3f6ea";
var FILES = [
  "./",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png",
  "icons/breathe-96.png",
  "icons/heart-96.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "icons/practice-96.png",
  "icons/sleep-96.png"
];

self.addEventListener("install", function (e) {
  // cache:"reload" skips the HTTP cache, so a fresh deploy is never stored from a stale copy
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      if (k.indexOf("entrain-") === 0 && k !== CACHE) return caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});

var SCOPE = new URL(self.registration.scope).pathname;     // e.g. /biney/

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The app is one page: any visit to it (with or without a #section) gets the stored copy.
  if (req.mode === "navigate" && (url.pathname === SCOPE || url.pathname === SCOPE + "index.html")) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match("./").then(function (hit) { return hit || fetch(req); });
    }).catch(function () { return fetch(req); }));
    return;
  }

  // Everything else that we stored comes from the store; the rest goes to the network.
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); });
  }));
});
