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

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${app} Privacy Policy</title>
<meta name="description" content="How ${app} handles your information.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400&display=swap">
<style>
:root { --bg:#1C1814; --panel:#221C16; --fg:#EDE8DF; --muted:#A89880; --ghost:#6A5E52; --line:#3A3428; --accent:#C49080; color-scheme:dark;
  --serif:"Lora",Georgia,serif; --mono:"JetBrains Mono",ui-monospace,Menlo,monospace; }
@media (prefers-color-scheme: light) { :root { --bg:#FAF7F2; --panel:#F3EDE3; --fg:#1C1814; --muted:#7D6E5A; --ghost:#A89880; --line:#E2D9CA; --accent:#B67A68; color-scheme:light; } }
* { box-sizing:border-box; }
html { -webkit-text-size-adjust:100%; }
body { margin:0; background:var(--bg); color:var(--fg); font-family:var(--serif); font-size:17px; line-height:1.65; }
a { color:var(--accent); text-underline-offset:3px; text-decoration-thickness:1px; overflow-wrap:anywhere; }
header, main, footer { max-width:44rem; margin:0 auto; padding:0 16px; }
header { padding-top:28px; font-family:var(--mono); font-size:11.5px; letter-spacing:.1em; text-transform:uppercase; }
header a { color:var(--ghost); text-decoration:none; }
main { padding-bottom:48px; }
h1 { font-size:clamp(30px,6vw,42px); line-height:1.15; font-weight:600; margin:40px 0 8px; }
h1 + p em { font-style:normal; font-family:var(--mono); font-size:12px; letter-spacing:.06em; color:var(--ghost); }
h2 { font-size:22px; font-weight:600; margin:44px 0 10px; }
p, li { color:var(--fg); }
strong { font-weight:600; }
ul { padding-left:20px; }
.tbl { overflow-x:auto; margin:16px 0; border:1px solid var(--line); border-radius:8px; }
table { border-collapse:collapse; width:100%; font-size:15px; line-height:1.5; }
th, td { text-align:left; vertical-align:top; padding:10px 12px; border-top:1px solid var(--line); }
thead th { border-top:0; background:var(--panel); font-family:var(--mono); font-weight:400; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
@media (max-width:640px) {
  .tbl { border:0; overflow:visible; }
  table, tbody, tr, td { display:block; width:100%; }
  thead { display:none; }
  tr { border:1px solid var(--line); border-radius:8px; margin:0 0 12px; padding:4px 0; }
  td { border:0; padding:6px 12px; }
  td::before { content:attr(data-label); display:block; font-family:var(--mono); font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--ghost); }
}
footer { padding-bottom:40px; border-top:1px solid var(--line); padding-top:16px; font-family:var(--mono); font-size:11.5px; color:var(--ghost); }
footer a { color:var(--ghost); }
</style>
</head>
<body>
<header><a href="/">agarwalchirag.com</a></header>
<main>
${body}
</main>
<footer>${app} · Chirag Agarwal Labs · <a href="mailto:apps@agarwalchirag.com">apps@agarwalchirag.com</a></footer>
</body>
</html>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log('wrote ' + out);
