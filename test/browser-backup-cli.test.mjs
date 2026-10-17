import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreBoard } from '../scripts/browser-backup-cli.mjs';

function harness({ answer = 'RESTORE', rescueError, verificationError, matching = true } = {}) {
  const source = {
    file: '/synthetic/backups/source.json', tiles: 2, images: 1, rows: 4, columns: 5,
    imageBytes: 68, sha256: '1'.repeat(64), contentSha256: '2'.repeat(64), locale: 'en',
  };
  const rescue = { ...source, file: '/synthetic/backups/rescue.json', contentSha256: '3'.repeat(64) };
  const after = { ...source, file: '/synthetic/backups/after.json', contentSha256: matching ? source.contentSha256 : '4'.repeat(64) };
  const initialBaseline = new Map([['old export', 'old stamp']]);
  const verificationBaseline = new Map([['rescue export', 'rescue stamp']]);
  const events = [];
  const messages = [];
  const retained = [];
  let captures = 0;
  const config = { source, directory: '/synthetic/downloads', baseline: initialBaseline, timeoutMs: 1000 };
  const adapters = {
    capture: async (directory, baseline, options) => {
      assert.equal(directory, config.directory);
      assert.equal(options.timeoutMs, config.timeoutMs);
      assert.equal(baseline, captures === 0 ? initialBaseline : verificationBaseline);
      captures++;
      events.push(captures === 1 ? 'capture rescue' : 'capture verification');
      if (captures > 1 && verificationError) throw verificationError;
      return captures === 1 ? '/synthetic/downloads/rescue.json' : '/synthetic/downloads/after.json';
    },
    archive: async (file, { label }) => {
      events.push(`archive ${label}`);
      if (label === 'before-restore') {
        assert.equal(file, '/synthetic/downloads/rescue.json');
        if (rescueError) throw rescueError;
        retained.push(rescue);
        return rescue;
      }
      assert.equal(label, 'after-restore');
      assert.equal(file, '/synthetic/downloads/after.json');
      retained.push(after);
      return after;
    },
    snapshot: async directory => {
      assert.equal(directory, config.directory);
      events.push('snapshot verification');
      return verificationBaseline;
    },
    createPrompt: () => {
      events.push('open prompt');
      return {
        question: async () => { events.push('confirm'); return answer; },
        close: () => { events.push('close prompt'); },
      };
    },
    log: message => {
      messages.push(message);
      if (message.includes('Click Import backup')) events.push('show import instructions');
      if (message.startsWith('Restoration verified')) events.push('report success');
    },
  };
  return { config, adapters, events, messages, retained, rescue, after };
}

test('cancelling restore retains the destination rescue without exposing import instructions', async () => {
  const flow = harness({ answer: 'cancel' });
  await restoreBoard(flow.config, flow.adapters);
  assert.deepEqual(flow.retained, [flow.rescue]);
  assert.ok(flow.events.indexOf('archive before-restore') < flow.events.indexOf('confirm'));
  assert.ok(flow.messages.some(message => message.startsWith('Cancelled')));
  assert.ok(!flow.events.includes('show import instructions'));
  assert.ok(!flow.events.includes('snapshot verification'));
  assert.ok(!flow.events.includes('capture verification'));
  assert.ok(!flow.events.includes('report success'));
  assert.equal(flow.events.at(-1), 'close prompt');
});

test('a failed destination rescue prevents confirmation and all restore instructions', async () => {
  const failure = new Error('Synthetic disk full');
  const flow = harness({ rescueError: failure });
  await assert.rejects(restoreBoard(flow.config, flow.adapters), error => error === failure);
  assert.deepEqual(flow.retained, []);
  assert.ok(!flow.events.includes('open prompt'));
  assert.ok(!flow.events.includes('confirm'));
  assert.ok(!flow.events.includes('show import instructions'));
  assert.ok(!flow.events.includes('report success'));
});

test('a content mismatch retains both exports, names the rescue, and never reports success', async () => {
  const flow = harness({ matching: false });
  await assert.rejects(restoreBoard(flow.config, flow.adapters), error => {
    assert.match(error.message, /Restoration is NOT verified/);
    assert.ok(error.message.includes(flow.rescue.file));
    return true;
  });
  assert.deepEqual(flow.retained, [flow.rescue, flow.after]);
  assert.ok(flow.events.includes('show import instructions'));
  assert.ok(!flow.events.includes('report success'));
  assert.equal(flow.events.at(-1), 'close prompt');
});

test('restore reports success only after rescue, confirmation and a matching fresh export', async () => {
  const flow = harness();
  await restoreBoard(flow.config, flow.adapters);
  assert.deepEqual(flow.retained, [flow.rescue, flow.after]);
  const orderedMilestones = [
    'archive before-restore', 'confirm', 'snapshot verification', 'show import instructions',
    'capture verification', 'archive after-restore', 'report success', 'close prompt',
  ];
  for (let index = 1; index < orderedMilestones.length; index++) {
    assert.ok(flow.events.indexOf(orderedMilestones[index - 1]) < flow.events.indexOf(orderedMilestones[index]));
  }
  const instructions = flow.messages.find(message => message.includes('Click Import backup'));
  assert.ok(instructions.includes(flow.config.source.file));
  assert.ok(instructions.includes(flow.rescue.file));
  assert.match(instructions, /Reload the page/);
});

test('verification timeout keeps the rescue and closes the prompt without reporting success', async () => {
  const failure = new Error('Synthetic export timeout');
  const flow = harness({ verificationError: failure });
  await assert.rejects(restoreBoard(flow.config, flow.adapters), error => error === failure);
  assert.deepEqual(flow.retained, [flow.rescue]);
  assert.ok(!flow.events.includes('report success'));
  assert.equal(flow.events.at(-1), 'close prompt');
});
