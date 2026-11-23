// Synthèse des rapports bruts en un fichier resume.md + resume.json.
// Usage : node summarize.js <dossier_de_sortie>
const fs = require('fs');
const path = require('path');

const out = process.argv[2];
const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')); } catch { return null; } };
const exists = (f) => fs.existsSync(path.join(out, f));
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const r2 = (x) => Math.round(x * 100) / 100;
const R = {};
const md = [];

const meta = read('meta.json') || {};
md.push(`# Synthèse des mesures — \`${meta.ref}\``, '',
  `Commit \`${meta.commit}\` — généré le ${meta.date}.`, '',
  'Fichier généré automatiquement par `infra/analyse/summarize.js`. Les rapports bruts sont dans les sous-dossiers.', '');

// ---- SonarQube (ISO 5055)
const sm = read('sonarqube/mesures.json');
if (sm) {
  const m = Object.fromEntries(sm.component.measures.map((x) => [x.metric, x.value]));
  const rating = (v) => (v ? 'ABCDE'[Math.round(+v) - 1] : '—');
  R.sonar = m;
  md.push('## 1. ISO 5055 — SonarQube 10.7 Community (profil « Sonar way »)', '',
    '| Caractéristique ISO 5055 | Métrique | Valeur |', '|---|---|---|',
    `| Taille | Lignes de code (ncloc) / fichiers / classes | ${m.ncloc} / ${m.files} / ${m.classes} |`,
    `| Fiabilité | Bugs / note | ${m.bugs} / ${rating(m.reliability_rating)} |`,
    `| Sécurité | Vulnérabilités / note | ${m.vulnerabilities} / ${rating(m.security_rating)} |`,
    `| Sécurité | Security hotspots / note de revue | ${m.security_hotspots} / ${rating(m.security_review_rating)} |`,
    `| Maintenabilité | Code smells / note | ${m.code_smells} / ${rating(m.sqale_rating)} |`,
    `| Maintenabilité | Dette technique | ${m.sqale_index} min (≈ ${r2(m.sqale_index / 480)} j) — ratio ${m.sqale_debt_ratio} % |`,
    `| Maintenabilité | Duplication | ${m.duplicated_lines_density} % (${m.duplicated_blocks} blocs) |`,
    `| Maintenabilité | Complexité cyclomatique / cognitive | ${m.complexity} / ${m.cognitive_complexity} |`,
    `| Fiabilité | Couverture de tests | ${m.coverage ?? '0'} % |`,
    `| Toutes | Violations (bloq./crit./maj./min./info) | ${m.violations} (${m.blocker_violations}/${m.critical_violations}/${m.major_violations}/${m.minor_violations}/${m.info_violations}) |`,
    '');
  const qg = read('sonarqube/quality-gate-defaut.json');
  if (qg) md.push(`Quality Gate par défaut de l'outil : **${qg.projectStatus.status}** (pour information ; le gate du projet sera celui du contrat qualité).`, '');
}

// ---- Pareto des règles
const issues = read('sonarqube/issues.json');
if (issues && issues.length) {
  const byRule = {};
  for (const i of issues) {
    const k = i.rule;
    byRule[k] = byRule[k] || { rule: k, count: 0, severity: i.severity, type: i.type, msg: i.message };
    byRule[k].count++;
  }
  const rows = Object.values(byRule).sort((a, b) => b.count - a.count);
  let cum = 0;
  md.push('## 2. Pareto des violations (top 15 règles)', '', '| # | Règle | Type | Sévérité | Nb | % cumulé | Exemple de message |', '|---|---|---|---|---|---|---|');
  rows.slice(0, 15).forEach((r, i) => {
    cum += r.count;
    md.push(`| ${i + 1} | \`${r.rule}\` | ${r.type} | ${r.severity} | ${r.count} | ${r2((cum / issues.length) * 100)} % | ${r.msg.replace(/\|/g, '/').slice(0, 90)} |`);
  });
  const n80 = (() => { let c = 0; for (let i = 0; i < rows.length; i++) { c += rows[i].count; if (c / issues.length >= 0.8) return i + 1; } return rows.length; })();
  md.push('', `Total : ${issues.length} violations, ${rows.length} règles distinctes. **${n80} règles (${r2((n80 / rows.length) * 100)} %) produisent 80 % des violations.**`, '');
  R.pareto = { total: issues.length, regles: rows.length, regles80: n80, top: rows.slice(0, 15) };
  fs.writeFileSync(path.join(out, 'sonarqube', 'pareto.csv'),
    'regle,type,severite,nombre\n' + rows.map((r) => `${r.rule},${r.type},${r.severity},${r.count}`).join('\n'));
}

// ---- Fichiers les plus mal notés
const files = read('sonarqube/fichiers.json');
if (files && files.length) {
  const v = (f, k) => +((f.measures.find((m) => m.metric === k) || {}).value || 0);
  const top = files.map((f) => ({ path: f.path, debt: v(f, 'sqale_index'), smells: v(f, 'code_smells'), cx: v(f, 'complexity'), ncloc: v(f, 'ncloc') }))
    .sort((a, b) => b.debt - a.debt).slice(0, 10);
  md.push('## 3. Fichiers les plus endettés (candidats « points chauds »)', '', '| Fichier | Dette (min) | Code smells | Complexité | Lignes |', '|---|---|---|---|---|');
  top.forEach((f) => md.push(`| \`${f.path}\` | ${f.debt} | ${f.smells} | ${f.cx} | ${f.ncloc} |`));
  md.push('');
  R.fichiers = top;
}

// ---- CK
if (exists('ck/class.csv')) {
  const lines = fs.readFileSync(path.join(out, 'ck/class.csv'), 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const rows = lines.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [head[i], v])));
  const num = (k) => rows.map((r) => +r[k]).filter((x) => !Number.isNaN(x) && x >= 0);
  const stat = (k) => ({ moyenne: r2(mean(num(k))), mediane: r2(median(num(k))), max: Math.max(...num(k)) });
  const ck = { classes: rows.length, cbo: stat('cbo'), dit: stat('dit'), noc: stat('noc'), wmc: stat('wmc'), rfc: stat('rfc'), lcom: stat('lcom'), 'lcom*': stat('lcom*'), loc: stat('loc') };
  R.ck = ck;
  md.push('## 4. Métriques orientées objet — CK 0.7.0 (backend Java)', '', `${ck.classes} types analysés.`, '',
    '| Métrique | Signification | Moyenne | Médiane | Max |', '|---|---|---|---|---|',
    ...[['cbo', 'Couplage entre objets'], ['dit', "Profondeur d'héritage"], ['noc', "Nombre d'enfants"], ['wmc', 'Complexité pondérée des méthodes'],
      ['rfc', 'Réponse pour une classe'], ['lcom', 'Manque de cohésion (CK)'], ['lcom*', 'Manque de cohésion normalisé (0-1)'], ['loc', 'Lignes par classe']]
      .map(([k, s]) => `| ${k.toUpperCase()} | ${s} | ${ck[k].moyenne} | ${ck[k].mediane} | ${ck[k].max} |`));
  const worst = [...rows].sort((a, b) => +b.wmc - +a.wmc).slice(0, 8);
  md.push('', 'Classes les plus complexes (WMC) :', '', '| Classe | WMC | CBO | LCOM | LOC |', '|---|---|---|---|---|',
    ...worst.map((r) => `| \`${r.class}\` | ${r.wmc} | ${r.cbo} | ${r.lcom} | ${r.loc} |`), '');
}

// ---- Constructibilité
try {
  const st = fs.readFileSync(path.join(out, 'frontend-public-build.status'), 'utf8').trim();
  const tsErr = (fs.readFileSync(path.join(out, 'frontend-public-build.log'), 'utf8').match(/error TS\d+/g) || []).length;
  R.buildFront = { statut: st, erreursTypeScript: tsErr };
  md.push('## Constructibilité', '',
    `\`npm run build\` (frontend-public, tsc + vite) : **${st}**${tsErr ? ` — ${tsErr} erreur(s) TypeScript` : ''}.`,
    st === 'ECHEC' ? 'Pour Lighthouse, le front a été construit avec `vite build` seul (sans vérification de types).' : '', '');
} catch { /* pas de mesure */ }

// ---- Couverture JaCoCo
if (exists('jacoco/jacoco.csv')) {
  const l = fs.readFileSync(path.join(out, 'jacoco/jacoco.csv'), 'utf8').trim().split('\n').slice(1).map((x) => x.split(','));
  const miss = l.reduce((s, r) => s + +r[7], 0), cov = l.reduce((s, r) => s + +r[8], 0);
  R.couverture = r2((cov / (miss + cov || 1)) * 100);
  md.push('## 5. Couverture — JaCoCo 0.8.12', '', `Couverture des lignes : **${R.couverture} %**.`, '');
} else {
  R.couverture = 0;
  md.push('## 5. Couverture — JaCoCo 0.8.12', '', '**0 %** — aucun test exécuté (voir `maven-build.log`).', '');
}

// ---- Sécurité
md.push('## 6. Sécurité', '', '| Outil | Portée | Résultat |', '|---|---|---|');
const gh = read('securite/gitleaks-historique.json'), ga = read('securite/gitleaks-arborescence.json');
if (gh) md.push(`| Gitleaks 8.21.2 | Historique Git jusqu'à ${meta.ref} | ${gh.length} secret(s) |`);
if (ga) md.push(`| Gitleaks 8.21.2 | Arborescence à ${meta.ref} | ${ga.length} secret(s) potentiel(s) (${[...new Set(ga.map((x) => x.RuleID))].join(', ') || '—'}) |`);
const tv = read('securite/trivy-fs.json');
if (tv) {
  const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 }; let sec = 0, mis = 0;
  for (const r of tv.Results || []) {
    (r.Vulnerabilities || []).forEach((v) => c[v.Severity]++);
    sec += (r.Secrets || []).length; mis += (r.Misconfigurations || []).length;
  }
  R.trivy = { ...c, secrets: sec, misconfig: mis };
  md.push(`| Trivy 0.75.0 | Dépendances (pom, package-lock) | ${c.CRITICAL} critiques, ${c.HIGH} hautes, ${c.MEDIUM} moyennes, ${c.LOW} faibles |`,
    `| Trivy 0.75.0 | Secrets / mauvaises configurations | ${sec} / ${mis} |`);
}
for (const p of ['backend', 'frontend-public', 'backoffice-admin', 'test-automation']) {
  const a = read(`securite/npm-audit-${p}.json`);
  if (a && a.metadata) { const v = a.metadata.vulnerabilities; md.push(`| npm audit | ${p} | ${v.critical} critiques, ${v.high} hautes, ${v.moderate} moyennes, ${v.low} faibles |`); }
}
md.push('');

// ---- Lighthouse
if (exists('lighthouse')) {
  const groups = {};
  for (const f of fs.readdirSync(path.join(out, 'lighthouse')).filter((f) => f.endsWith('.report.json'))) {
    const name = f.replace(/-run\d+\.report\.json$/, '');
    const j = read(`lighthouse/${f}`);
    (groups[name] = groups[name] || []).push({
      perf: j.categories.performance.score * 100, a11y: j.categories.accessibility.score * 100,
      bp: j.categories['best-practices'].score * 100, seo: j.categories.seo.score * 100,
      lcp: j.audits['largest-contentful-paint'].numericValue, fcp: j.audits['first-contentful-paint'].numericValue,
      tbt: j.audits['total-blocking-time'].numericValue, cls: j.audits['cumulative-layout-shift'].numericValue,
    });
  }
  R.lighthouse = {};
  md.push('## 7. Applications web — Lighthouse 12.2.1 (preset desktop, médiane de 3 passages)', '',
    '| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS |', '|---|---|---|---|---|---|---|---|---|');
  for (const [n, runs] of Object.entries(groups)) {
    const m = (k) => r2(median(runs.map((r) => r[k])));
    R.lighthouse[n] = { perf: m('perf'), a11y: m('a11y'), bp: m('bp'), seo: m('seo'), fcp: m('fcp'), lcp: m('lcp'), tbt: m('tbt'), cls: m('cls') };
    md.push(`| ${n} | ${m('perf')} | ${m('a11y')} | ${m('bp')} | ${m('seo')} | ${Math.round(m('fcp'))} | ${Math.round(m('lcp'))} | ${Math.round(m('tbt'))} | ${m('cls')} |`);
  }
  md.push('');
}

md.push('## Interprétation', '', '_À compléter par l\'équipe : lecture de chaque métrique et conséquences pour le plan d\'action._', '');
fs.writeFileSync(path.join(out, 'resume.md'), md.join('\n'));
fs.writeFileSync(path.join(out, 'resume.json'), JSON.stringify(R, null, 2));
console.log(md.join('\n'));
