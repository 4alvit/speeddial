import fs from 'node:fs';
import path from 'node:path';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Read credentials once, before opening the database. Rotation requires a
// restart; missing credentials must never recreate an old persistent key.
export function loadAccess(environment = process.env) {
  function credential(name) {
    const filename = environment[name];
    if (!filename || !path.isAbsolute(filename)) throw new Error(`${name} must name an absolute credential file`);
    try {
      const value = fs.readFileSync(filename);
      if (value.length > 4096) throw new Error();
      return value;
    } catch { throw new Error(`${name} could not be read as a credential file`); }
  }
  const token = credential('ACCESS_TOKEN_FILE').toString('utf8').trim();
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new Error('ACCESS_TOKEN_FILE must contain 32–256 URL-safe characters');
  const key = credential('SESSION_KEY_FILE');
  if (key.length < 32) throw new Error('SESSION_KEY_FILE must contain at least 32 bytes');
  const epoch = environment.AUTH_EPOCH || '1';
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(epoch)) throw new Error('AUTH_EPOCH must contain 1–128 safe identifier characters');
  const fingerprint = createHash('sha256').update(token).digest();
  const context = `speeddial-access-v3:${fingerprint.toString('hex')}:${epoch}:`;
  return {
    accepts(searchParams) {
      const values = searchParams.getAll('access');
      if (values.length !== 1 || values[0].length > 256) return false;
      return timingSafeEqual(createHash('sha256').update(values[0]).digest(), fingerprint);
    },
    sign(text) { return createHmac('sha256', key).update(context).update(text).digest('base64url'); },
  };
}
