import assert from 'node:assert/strict';
import '../local/storage.js';

const { validation, limits } = globalThis.SpeedialStorage;
const types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function fuzz(data) {
  if (data.length > 65536) return;
  const type = types[(data[0] ?? 0) % types.length];
  const payload = data.subarray(1);
  let dimensions;
  try { dimensions = validation.imageDimensions(payload, type); }
  catch (error) {
    assert(['INVALID_IMAGE', 'INVALID_IMAGE_SIZE'].includes(error.code), `unexpected image failure: ${error.stack}`);
    assert.equal(error.status, 400);
    return;
  }
  assert(Number.isInteger(dimensions.width) && Number.isInteger(dimensions.height));
  assert(dimensions.width > 0 && dimensions.width <= limits.imageDimension);
  assert(dimensions.height > 0 && dimensions.height <= limits.imageDimension);
  assert(dimensions.width * dimensions.height <= limits.imagePixels);
  // The same bytes must be parsed identically with a non-zero backing-buffer offset.
  const padded = new Uint8Array(payload.length + 13);
  padded.set(payload, 7);
  assert.deepEqual(validation.imageDimensions(padded.subarray(7, 7 + payload.length), type), dimensions);
  assert.deepEqual(validation.base64Bytes(Buffer.from(payload).toString('base64')), Uint8Array.from(payload));
}
