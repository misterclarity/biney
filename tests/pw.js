// Shared by the suites: Playwright, where the built app is, and a folder for screenshots.
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');

function playwright() {
  const tries = [process.env.PLAYWRIGHT, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  throw new Error('Playwright not found. Run "npm install playwright" and "npx playwright install chromium", or set PLAYWRIGHT to its folder.');
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out') + path.sep;
fs.mkdirSync(OUT, { recursive: true });

module.exports = {
  chromium: playwright().chromium,
  ROOT, OUT,
  APP: pathToFileURL(path.join(ROOT, 'index.html')).href,              // the built app
  PAGE: pathToFileURL(path.join(ROOT, 'entrain-page.html')).href       // the preview page (no worker, no manifest)
};
