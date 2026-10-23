import { defineConfig, devices } from '@playwright/test';
import { join } from 'node:path';
import { ambienteAtual } from './ambiente';

// Credenciais de cada pessoa ficam no .env local dela (veja .env.example).
try { process.loadEnvFile(join(__dirname, '.env')); } catch { /* sem .env: a fixture `conta` avisa o que falta */ }

const ambiente = ambienteAtual();
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: process.env.DISPARA_PASTA ?? 'meus-testes',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  // O Toolshop é público e às vezes oscila: uma nova tentativa no CI separa instabilidade de bug.
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  // O JSON fica fora de test-results/: o Playwright apaga essa pasta no começo de cada execução.
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: process.env.RELATORIO_HTML ?? 'playwright-report' }],
    ['json', { outputFile: process.env.RELATORIO_JSON ?? 'relatorio-json/resultado.json' }],
    // No CI, cada falha vira uma anotação no GitHub (aparece no PR e é legível pela API)
    ...(CI ? [['github'] as ['github']] : []),
  ],
  metadata: { ambiente: ambiente.id },
  use: {
    baseURL: ambiente.baseURL,
    testIdAttribute: 'data-test',
    locale: 'en-US',
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    // No CI o trace já basta; vídeo de cada falha deixava o artefato com 450 MB
    video: CI ? 'off' : 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Celular: só os @smoke de interface, no mesmo Chromium (sem instalar outro navegador no CI)
    { name: 'celular', use: { ...devices['Pixel 7'] }, grep: /@smoke/, testIgnore: ['**/api/**'] },
  ],
});
