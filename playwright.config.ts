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
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: process.env.RELATORIO_HTML ?? 'playwright-report' }],
    ['json', { outputFile: process.env.RELATORIO_JSON ?? 'test-results/resultado.json' }],
  ],
  metadata: { ambiente: ambiente.id },
  use: {
    baseURL: ambiente.baseURL,
    testIdAttribute: 'data-test',
    locale: 'en-US',
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Celular: só os @smoke de interface, no mesmo Chromium (sem instalar outro navegador no CI)
    { name: 'celular', use: { ...devices['Pixel 7'] }, grep: /@smoke/, testIgnore: ['**/api/**'] },
  ],
});
