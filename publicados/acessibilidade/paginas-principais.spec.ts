import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures';
import type { Page, TestInfo } from '@playwright/test';

/**
 * Roda o axe (WCAG 2.0/2.1 A e AA). Só reprova violação crítica;
 * as outras ficam anotadas no relatório e anexadas em JSON para análise.
 */
async function verificarAcessibilidade(page: Page, info: TestInfo) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await info.attach('axe-violacoes.json', { body: JSON.stringify(resultado.violations, null, 2), contentType: 'application/json' });
  for (const v of resultado.violations) {
    info.annotations.push({ type: `a11y-${v.impact ?? 'sem-impacto'}`, description: `${v.id}: ${v.help} (${v.nodes.length} elemento(s))` });
  }
  const criticas = resultado.violations.filter(v => v.impact === 'critical').map(v => `${v.id}: ${v.help}`);
  expect(criticas, 'violações críticas de acessibilidade').toEqual([]);
}

test.describe('Acessibilidade', () => {
  test('catálogo sem violações críticas @a11y', async ({ page, catalogo }, info) => {
    await catalogo.abrir();
    await expect(catalogo.nomes.first()).toBeVisible();
    await verificarAcessibilidade(page, info);
  });

  test('login sem violações críticas @a11y', async ({ page, login }, info) => {
    await login.abrir();
    await expect(login.email).toBeVisible();
    await verificarAcessibilidade(page, info);
  });

  test('contato sem violações críticas @a11y', async ({ page }, info) => {
    await page.goto('/contact');
    await expect(page.getByTestId('contact-submit')).toBeVisible();
    await verificarAcessibilidade(page, info);
  });
});
