// A stand-in for the Screen Wake Lock API. Headless Chromium turns every request down, which would show
// the app's screen-lock notice in every suite, so pw.js installs this on every page. window.__wl counts
// requests and releases; localStorage "test.wl" set to "none" hides the API and "deny" turns requests
// down, for the checks of those notices.
module.exports = () => {
  if (window.__wl) return;
  const log = window.__wl = { req: 0, rel: 0, held: 0, last: null };
  const flag = () => { try { return localStorage.getItem('test.wl'); } catch (e) { return null; } };
  class Lock extends EventTarget {
    constructor() { super(); this.type = 'screen'; this.released = false; this.onrelease = null; }
    release() {
      if (!this.released) {
        this.released = true; log.rel++; log.held--;
        const e = new Event('release'); this.dispatchEvent(e); if (this.onrelease) this.onrelease(e);
      }
      return Promise.resolve();
    }
  }
  const api = {
    request() {
      if (flag() === 'deny') return Promise.reject(new DOMException('Wake Lock permission request denied', 'NotAllowedError'));
      log.req++; log.held++;
      return Promise.resolve(log.last = new Lock());
    }
  };
  Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get() { return flag() === 'none' ? undefined : api; } });
};
