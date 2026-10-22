import { test, expect, preco } from '../../fixtures';

test('mostra o mesmo nome e preço da listagem no detalhe', async ({ catalogo, produto }) => {
  await catalogo.abrir();
  await catalogo.buscar('Combination Pliers');

  const cartao = catalogo.cartao('Combination Pliers');
  const precoNaLista = preco(await cartao.getByTestId('product-price').textContent());
  await cartao.click();

  await expect(produto.nome).toHaveText('Combination Pliers');
  expect(await produto.precoUnitario()).toBe(precoNaLista);
  await expect(produto.descricao).not.toBeEmpty();
  await expect(produto.botaoAdicionar).toBeEnabled();
});
