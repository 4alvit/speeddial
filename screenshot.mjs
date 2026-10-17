import { Worker } from 'node:worker_threads';
import { parseWebURL } from './safe-proxy.mjs';

export async function capture(url) {
  parseWebURL(url);
  const entry = new URL('./screenshot-worker.mjs', import.meta.url);
  return new Promise((resolve, reject) => {
    const worker = new Worker(entry, { workerData: { entry: entry.href, url } });
    let settled = false;
    const finish = (error, bytes) => {
      if (settled) return;
      settled = true;
      // Also handles unexpected live resources after a result or worker failure.
      // The worker posts successful results only after proxy/browser cleanup.
      worker.terminate().then(() => {
        if (error) reject(error); else resolve(bytes);
      }, terminationError => reject(error || terminationError));
    };
    worker.on('message', message => {
      if (message?.ok === true && message.bytes instanceof Uint8Array) {
        finish(null, Buffer.from(message.bytes));
      } else if (message?.ok === false && typeof message.error?.message === 'string') {
        const error = new Error(message.error.message);
        if (typeof message.error.name === 'string') error.name = message.error.name;
        if (typeof message.error.stack === 'string') error.stack = message.error.stack;
        if (typeof message.error.code === 'string') error.code = message.error.code;
        finish(error);
      } else {
        finish(new Error('Screenshot worker returned an invalid result'));
      }
    });
    worker.once('error', error => finish(error));
    worker.once('exit', code => {
      if (!settled) finish(new Error(`Screenshot worker exited without a result (code ${code})`));
    });
  });
}
