// dispara: 2 valor(es) sensível(is) removido(s) na publicação.
//   linha ~16: caminho pessoal
//   linha ~17: e-mail real

import { test, expect, entrar } from '../../fixtures';

// Rascunho de exemplo: deixa um caminho pessoal e um e-mail de propósito,
// para a Revisão de segurança mostrar a limpeza feita na publicação.

test('admin vê a lista de pedidos @regressao', async ({ page, conta }) => {
  test.skip(conta.avatar.id !== 'admin', 'Rode com a conta "Admin"');
  await entrar(page, conta);
  await expect(page.getByTestId('page-title')).toHaveText('Sales over the years');

  await page.getByTestId('nav-menu').click();
  await page.getByTestId('nav-admin-orders').click();

  await expect(page.getByTestId('page-title')).toHaveText('Order');
  await expect(page.getByTestId(/^order-edit-/).first()).toBeVisible();
  // Referência do layout do painel: ~/Desktop/toolshop-admin-pedidos.png
  test.info().annotations.push({ type: 'revisado-por', description: '***@example.com' });
});
