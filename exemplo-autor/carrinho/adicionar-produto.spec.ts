import { test, expect } from '../../fixtures';

test('adiciona 2 unidades ao carrinho com o total certo @smoke', async ({ catalogo, produto, menu, carrinho }) => {
  await catalogo.abrirProduto('Combination Pliers');
  const unitario = await produto.precoUnitario();

  await produto.aumentarQuantidade();
  await expect(produto.quantidade).toHaveValue('2');
  await produto.adicionarAoCarrinho();

  await expect(produto.aviso('Product added to shopping cart.')).toBeVisible();
  await expect(menu.quantidadeNoCarrinho).toHaveText('2');

  await menu.abrirCarrinho();
  await expect(carrinho.tituloDoProduto).toContainText('Combination Pliers');
  await expect(carrinho.quantidade).toHaveValue('2');
  expect(await carrinho.precoDaLinha()).toBeCloseTo(unitario * 2, 2);
});
