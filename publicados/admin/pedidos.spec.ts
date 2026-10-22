// dispara: 2 valor(es) sensível(is) removido(s) na publicação.
//   linha ~15: caminho pessoal
//   linha ~16: e-mail real

import { test, expect } from '../../fixtures';

// Rascunho de exemplo: deixa um caminho pessoal e um e-mail de propósito,
// para a Revisão de segurança mostrar a limpeza feita na publicação.

test('admin vê a lista de pedidos @regressao', async ({ page, login, menu, conta }) => {
  test.skip(conta.avatar.id !== 'admin', 'Rode com a conta "Admin"');
  await login.entrarCom(conta);
  await expect(login.titulo).toHaveText('Sales over the years');

  await menu.irPara('nav-admin-orders');

  await expect(login.titulo).toHaveText('Order');
  await expect(page.getByTestId(/^order-edit-/).first()).toBeVisible();
  // Referência do layout do painel: ~/Desktop/toolshop-admin-pedidos.png
  test.info().annotations.push({ type: 'revisado-por', description: '***@example.com' });
});
