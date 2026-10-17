import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Check only versionable source; never crawl databases, archives, or credentials.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0'))]
  .filter(name => name && fs.existsSync(path.join(root, name)));
const markdown = files.filter(name => name.endsWith('.md'));
const failures = [];
const diagramCheck = spawnSync('python3', ['docs/render-diagrams.py', '--check'], { cwd: root, encoding: 'utf8' });
if (diagramCheck.status !== 0) failures.push(diagramCheck.stderr.trim() || 'Generated documentation diagrams are out of date');
const withoutCode = source => source.replace(/^([`~]{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
function anchors(file) {
  const counts = new Map();
  return new Set([...withoutCode(fs.readFileSync(file, 'utf8')).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map(match => {
    const slug = match[1].replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, '').toLowerCase().replace(/ /g, '-');
    const index = counts.get(slug) || 0;
    counts.set(slug, index + 1);
    return slug + (index ? `-${index}` : '');
  }));
}
for (const name of markdown) {
  const file = path.join(root, name);
  const source = withoutCode(fs.readFileSync(file, 'utf8'));
  const links = [...source.matchAll(/!?\[[^\]\n]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)].map(match => match[1]);
  links.push(...[...source.matchAll(/^\[[^\]]+\]:\s+<?([^\s>]+)>?/gm)].map(match => match[1]));
  for (const link of links) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link)) continue;
    let target, fragment;
    try { [target, fragment] = link.split('#').map(decodeURIComponent); }
    catch { failures.push(`${name}: malformed link ${link}`); continue; }
    const resolved = target ? path.resolve(path.dirname(file), target.split('?')[0]) : file;
    if (!resolved.startsWith(root) || !fs.existsSync(resolved)) {
      failures.push(`${name}: missing local target ${link}`);
    } else if (fragment && resolved.endsWith('.md') && !anchors(resolved).has(fragment)) {
      failures.push(`${name}: missing heading ${link}`);
    }
  }
}
const svgFiles = files.filter(name => name.endsWith('.svg'));
const svgCheck = spawnSync('python3', ['-c', `import json,sys,xml.etree.ElementTree as ET
for name in json.load(sys.stdin):
    tree=ET.parse(name); root=tree.getroot()
    assert root.tag == '{http://www.w3.org/2000/svg}svg', name + ': invalid SVG root'
    assert 'viewBox' in root.attrib, name + ': missing viewBox'
    if name.startswith(('wiki/', 'docs/')):
        for tag in ('title', 'desc'):
            element=root.find('{http://www.w3.org/2000/svg}' + tag)
            assert element is not None and element.text, name + ': missing accessible ' + tag
`], { cwd: root, input: JSON.stringify(svgFiles), encoding: 'utf8' });
if (svgCheck.status !== 0) failures.push(svgCheck.stderr.trim() || 'SVG validation failed');
for (const locale of ['ru', 'de', 'fr', 'es']) {
  if (!files.includes(`README.${locale}.md`)) failures.push(`Missing README.${locale}.md`);
}
if (failures.length) throw new Error(failures.join('\n'));
console.log(`Documentation: ${markdown.length} Markdown files and ${svgFiles.length} SVG files passed.`);
