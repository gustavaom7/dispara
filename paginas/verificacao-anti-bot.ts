import { test, type Page } from '@playwright/test';

/**
 * O Toolshop público fica atrás do Cloudflare, que às vezes pede verificação anti-bot para máquinas do CI.
 * Não tentamos contornar: o teste é pulado com o motivo à vista e a triagem classifica como ambiente.
 */
export function telaDeVerificacao(page: Page) {
  return page.getByRole('heading', { name: 'Performing security verification' });
}

export async function pularSeVerificacaoAntiBot(page: Page) {
  test.skip(await telaDeVerificacao(page).isVisible(),
    'O Toolshop pediu verificação anti-bot (Cloudflare) para esta máquina. Rode de novo mais tarde ou na sua máquina.');
}
