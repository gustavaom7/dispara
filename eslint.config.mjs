// Lint dos testes: regras do Playwright que pegam os erros mais comuns de automação.
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'publicados/', 'meus-testes/', 'site/', 'scripts/', 'playwright-report/', 'test-results/', 'rascunhos-ia/.verificacao/'] },
  {
    files: ['exemplo-autor/**/*.ts', 'rascunhos-ia/**/*.ts', 'paginas/**/*.ts', 'fixtures.ts', 'ambiente.ts', 'playwright.config.ts'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['exemplo-autor/**/*.spec.ts', 'rascunhos-ia/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-force-option': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/missing-playwright-await': 'error',
      // asserções ficam em helpers locais (ex.: verificarAcessibilidade) e nos page objects
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['verificarAcessibilidade'] }],
    },
  },
);
