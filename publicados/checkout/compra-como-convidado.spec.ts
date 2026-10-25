import { test, expect, pessoaNova } from '../../fixtures';

test('compra como convidado até o número da fatura @destrutivo', async ({ catalogo, produto, menu, carrinho, checkout }) => {
  // Convidado, e não uma conta pública: não depende do carrinho de mais ninguém.
  const pessoa = pessoaNova();
  await catalogo.abrirProduto('Combination Pliers');
  await produto.adicionarAoCarrinho();
  await expect(menu.quantidadeNoCarrinho).toHaveText('1');

  await test.step('carrinho', async () => {
    await menu.abrirCarrinho();
    await carrinho.avancar();
  });
  await test.step('identificação como convidado', () => checkout.continuarComoConvidado(pessoa));
  await test.step('endereço', () => checkout.preencherEndereco());
  await test.step('pagamento na entrega', () => checkout.pagarNaEntrega());

  // O número da fatura vem dentro do texto de confirmação, sem elemento próprio
  await expect(checkout.confirmacao).toContainText('Thanks for your order', { timeout: 20_000 });
  await expect(checkout.confirmacao).toContainText(/INV-\d+/);
});
