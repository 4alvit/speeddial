import { parentPort, workerData } from 'node:worker_threads';
import { createSafeProxy, parseWebURL } from './safe-proxy.mjs';

export async function capturePage(url) {
  parseWebURL(url);
  // Load the browser driver only for captures, before allocating proxy resources.
  const { chromium } = await import('playwright-core');
  const proxy = await createSafeProxy();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true, proxy: { server: proxy.url, bypass: '<-loopback>' },
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-quic', '--disable-background-networking',
        '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'] });
    const context = await browser.newContext({ viewport: { width: 1366, height: 860 },
      deviceScaleFactor: 1, acceptDownloads: false, serviceWorkers: 'block', locale: 'en-US' });
    const page = await context.newPage();
    // No popups or persistent browser profile/cookies are used for previews.
    context.on('page', other => { if (other !== page) other.close().catch(() => {}); });
    page.on('dialog', dialog => dialog.dismiss().catch(() => {}));
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 22000 });
    if (!response || response.status() >= 400) throw new Error('The website returned an error or restricted access');
    await page.waitForTimeout(1800);
    return await page.screenshot({ type: 'jpeg', quality: 75, timeout: 5000 });
  } finally {
    // Browser shutdown can reject after a crash; still close the proxy and all
    // of its sockets so repeated failed captures do not leak resources.
    try { await browser?.close(); } finally { proxy.close(); }
  }
}

// Importing the implementation from another worker must not start a capture.
if (parentPort && workerData?.entry === import.meta.url) {
  try {
    const bytes = await capturePage(workerData.url);
    parentPort.postMessage({ ok: true, bytes });
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    parentPort.postMessage({ ok: false, error: {
      name: failure.name, message: failure.message, stack: failure.stack, code: failure.code,
    } });
  } finally {
    parentPort.close();
  }
}
