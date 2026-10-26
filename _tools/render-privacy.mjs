// Usage: node render-privacy.mjs <policy.md> <out.html> <YYYY-MM-DD> <App name>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const NM = '/Users/chirag/IdeaProjects/chirag3103.github.io/node_modules/';
const { unified } = await import(NM + 'unified/index.js');
const remarkParse = (await import(NM + 'remark-parse/index.js')).default;
const remarkGfm = (await import(NM + 'remark-gfm/index.js')).default;
const remarkRehype = (await import(NM + 'remark-rehype/index.js')).default;
const rehypeStringify = (await import(NM + 'rehype-stringify/index.js')).default;

const [src, out, date, app] = process.argv.slice(2);
const pretty = new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
let md = readFileSync(src, 'utf8').replaceAll('{LAST_UPDATED}', pretty);
const left = md.match(/\{[A-Z_]+\}/);
if (left) { console.error('Unfilled placeholder: ' + left[0]); process.exit(1); }

let body = String(await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).process(md));
body = body.replaceAll('<table>', '<div class="tbl"><table>').replaceAll('</table>', '</table></div>');
// Label each cell with its column header, for the stacked phone layout.
body = body.replace(/<table>([\s\S]*?)<\/table>/g, (t) => {
  const heads = [...(t.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  return t.replace(/<tbody>[\s\S]*?<\/tbody>/, (tb) => tb.replace(/<tr>([\s\S]*?)<\/tr>/g, (_, row) => {
    let i = 0;
    return '<tr>' + row.replace(/<td(\s[^>]*)?>/g, (m, a = '') => `<td${a} data-label="${heads[i++] ?? ''}">`) + '</tr>';
  }));
});
body = body.replace(/<a href="(https?:[^"]+)">/g, '<a href="$1" rel="noopener">');

// Essay layout: contents | policy | facts, same grid as the site's case studies.
const h1m = body.match(/<h1>([\s\S]*?)<\/h1>\s*/);
const title = h1m ? h1m[1] : `${app} Privacy Policy`;
if (h1m) body = body.replace(h1m[0], '');
const slug = (t) => t.replace(/<[^>]+>/g, '').toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toc = [];
body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, t) => { const id = slug(t); toc.push([id, t.replace(/<[^>]+>/g, '')]); return `<h2 id="${id}">${t}</h2>`; });
const product = { Bloom: '/bloom/' }[app];
const key = app.toLowerCase();
const nav = (product ? `<a href="${product}">${app}</a>` : '') + `<a href="/${key}/privacy/" aria-current="page">Privacy</a>`;

const html = `<!doctype html>
<html lang="en" class="${key}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${app} Privacy Policy</title>
<meta name="description" content="How ${app} handles your information.">
<meta name="theme-color" content="#1C1814">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<header class="bar"><a class="me" href="/">CHIRAG AGARWAL</a><nav>${nav}</nav></header>
<main class="essay">
<nav class="toc" aria-label="Contents"><span class="k">Contents</span>
${toc.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('\n')}
</nav>
<article class="body">
<div class="head"><h1>${title}</h1></div>
<div class="prose">
${body}
</div>
</article>
<aside class="side">
<dl class="facts">
<div><dt>App</dt><dd>${product ? `<a href="${product}">${app}</a>` : app}</dd></div>
<div><dt>Publisher</dt><dd>Chirag Agarwal Labs, Montréal</dd></div>
<div><dt>Last updated</dt><dd>${pretty}</dd></div>
<div><dt>Contact</dt><dd><a href="mailto:apps@agarwalchirag.com">apps@agarwalchirag.com</a></dd></div>
</dl>
</aside>
</main>
<footer class="foot"><span>${app.toUpperCase()} · CHIRAG AGARWAL LABS</span><a href="mailto:apps@agarwalchirag.com">APPS@AGARWALCHIRAG.COM</a><a href="/">AGARWALCHIRAG.COM</a></footer>
</body>
</html>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log('wrote ' + out);
