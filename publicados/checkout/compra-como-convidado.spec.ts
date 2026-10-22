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

  await expect(checkout.confirmacao).toContainText('Thanks for your order');
  await expect(checkout.numeroDaFatura).toHaveText(/^INV-\d+/);
});
