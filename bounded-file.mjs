import fs from 'node:fs';

// Open once and bound the bytes actually read, even if the file grows. Credential
// projections may use symlinks; callers exporting source can pin a prior lstat.
export function readBoundedFile(filename, maxBytes, { expectedStat } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 16 * 1024 * 1024)
    throw new Error('Invalid file byte limit');
  const flags = fs.constants.O_RDONLY | fs.constants.O_NONBLOCK |
    (expectedStat ? fs.constants.O_NOFOLLOW : 0);
  const descriptor = fs.openSync(filename, flags);
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) throw new Error('Input must be a regular file');
    if (expectedStat && (!expectedStat.isFile() ||
        String(before.dev) !== String(expectedStat.dev) || String(before.ino) !== String(expectedStat.ino)))
      throw new Error('Input file changed before reading');
    if (expectedStat) {
      // Windows may not provide O_NOFOLLOW. Retain the inode pin and reject an
      // observed final symlink even where the open flag is unavailable.
      const entry = fs.lstatSync(filename, { bigint: true });
      if (!entry.isFile() || entry.dev !== before.dev || entry.ino !== before.ino)
        throw new Error('Input file changed before reading');
    }
    if (before.size > BigInt(maxBytes)) throw new Error('Input file exceeds byte limit');
    const buffer = Buffer.alloc(Number(before.size) + 1);
    let used = 0;
    while (used < buffer.length) {
      const count = fs.readSync(descriptor, buffer, used, buffer.length - used, used);
      if (!count) break;
      used += count;
    }
    if (used > maxBytes) throw new Error('Input file exceeds byte limit');
    const after = fs.fstatSync(descriptor, { bigint: true });
    if (before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs ||
        BigInt(used) !== after.size) throw new Error('Input file changed while reading');
    return buffer.subarray(0, used);
  } finally {
    fs.closeSync(descriptor);
  }
}
