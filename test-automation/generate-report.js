/**
 * Générateur de Rapport HTML pour les tests E2E
 * 
 * Usage: node generate-report.js [--report test-report.json]
 */

const fs = require('fs');
const path = require('path');

const reportFile = process.argv.includes('--report') 
  ? process.argv[process.argv.indexOf('--report') + 1]
  : path.join(__dirname, 'test-report.json');

if (!fs.existsSync(reportFile)) {
  console.error(`Fichier de rapport non trouvé: ${reportFile}`);
  console.error('Exécutez d\'abord: npm test');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Test E2E - RHConnect</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #172A3A 0%, #0F766E 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-card {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
    }
    .summary-card.pass {
      border-color: #059669;
      background: #ecfdf5;
    }
    .summary-card.fail {
      border-color: #dc2626;
      background: #fee2e2;
    }
    .summary-card h3 {
      font-size: 24px;
      margin-bottom: 5px;
      color: #172A3A;
    }
    .summary-card.pass h3 { color: #059669; }
    .summary-card.fail h3 { color: #dc2626; }
    .summary-card p {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 20px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #059669, #10b981);
      transition: width 0.3s ease;
    }
    .content {
      padding: 40px;
    }
    h2 {
      color: #172A3A;
      margin-bottom: 20px;
      font-size: 24px;
      border-bottom: 2px solid #0F766E;
      padding-bottom: 10px;
    }
    .test-group {
      margin-bottom: 40px;
    }
    .test-item {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #e2e8f0;
      border-radius: 4px;
      background: #f8fafc;
      gap: 15px;
    }
    .test-item.pass {
      border-left-color: #059669;
      background: #ecfdf5;
    }
    .test-item.fail {
      border-left-color: #dc2626;
      background: #fee2e2;
    }
    .test-icon {
      font-size: 20px;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .test-details {
      flex: 1;
    }
    .test-name {
      font-weight: 600;
      color: #172A3A;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .test-item.fail .test-name {
      color: #991b1b;
    }
    .test-error {
      font-size: 12px;
      color: #991b1b;
      margin-top: 8px;
      padding: 8px;
      background: rgba(255,255,255,0.5);
      border-radius: 4px;
      border-left: 2px solid #dc2626;
      padding-left: 10px;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    .test-duration {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .test-item.pass .test-duration {
      color: #047857;
    }
    .metadata {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .metadata strong {
      color: #172A3A;
    }
    footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 20px;
    }
    .status-badge.pass {
      background: #ecfdf5;
      color: #047857;
    }
    .status-badge.fail {
      background: #fee2e2;
      color: #991b1b;
    }
    @media (max-width: 768px) {
      .summary {
        grid-template-columns: 1fr 1fr;
      }
      header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Rapport de Test End-to-End</h1>
      <p>Synchronisation Candidat ↔ Entreprise - RHConnect</p>
    </header>

    <div class="summary">
      <div class="summary-card">
        <h3>${report.summary.totalTests}</h3>
        <p>Tests Totaux</p>
      </div>
      <div class="summary-card pass">
        <h3>${report.summary.passed}</h3>
        <p>✅ Réussis</p>
      </div>
      <div class="summary-card ${report.summary.failed > 0 ? 'fail' : 'pass'}">
        <h3>${report.summary.failed}</h3>
        <p>${report.summary.failed > 0 ? '❌ Échoués' : '✅ Aucun Échecl'}</p>
      </div>
      <div class="summary-card">
        <h3>${(report.summary.passed / report.summary.totalTests * 100).toFixed(0)}%</h3>
        <p>Taux de Succès</p>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${report.summary.passed / report.summary.totalTests * 100}%"></div>
      </div>
    </div>

    <div class="content">
      <div class="metadata">
        <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString('fr-FR')}</p>
        <p><strong>API URL:</strong> ${report.environment.apiBaseUrl}</p>
        <p><strong>Durée totale:</strong> ${report.summary.totalDuration}ms</p>
      </div>

      <h2>📋 Résultats Détaillés</h2>

      ${groupTestsByStep(report.details)}

      <div class="status-badge ${report.summary.failed === 0 ? 'pass' : 'fail'}">
        ${report.summary.failed === 0 ? '✅ Tous les tests sont passés!' : '⚠️ Des tests ont échoué'}
      </div>
    </div>

    <footer>
      <p>Généré automatiquement par le script de test E2E de RHConnect</p>
      <p>Pour plus d'informations, consultez: <code>TEST-FLUX-CANDIDAT-ENTREPRISE.md</code></p>
    </footer>
  </div>
</body>
</html>`;

function groupTestsByStep(results) {
  const grouped = {};
  results.forEach(result => {
    const step = result.name.split(' - ')[0];
    if (!grouped[step]) grouped[step] = [];
    grouped[step].push(result);
  });

  return Object.entries(grouped).map(([step, tests]) => {
    const passed = tests.filter(t => t.status === 'PASS').length;
    const status = tests.every(t => t.status === 'PASS') ? 'pass' : 'fail';
    
    return `
      <div class="test-group">
        <h3 style="color: #0F766E; font-size: 18px; margin-bottom: 15px;">
          ${status === 'pass' ? '✅' : '❌'} ${step}
          <span style="font-size: 12px; color: #64748b; margin-left: 10px;">(${passed}/${tests.length})</span>
        </h3>
        ${tests.map(test => `
          <div class="test-item ${test.status.toLowerCase()}">
            <div class="test-icon">${test.status === 'PASS' ? '✅' : '❌'}</div>
            <div class="test-details">
              <div class="test-name">${test.name}</div>
              ${test.error ? `<div class="test-error">${escapeHtml(test.error)}</div>` : ''}
              <div class="test-duration">⏱️ ${test.duration}ms</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

const outputFile = path.join(__dirname, 'test-report.html');
fs.writeFileSync(outputFile, htmlContent);

console.log(`✅ Rapport HTML généré: ${outputFile}`);
console.log(`📊 Ouvrir le fichier dans un navigateur pour visualiser les résultats`);
